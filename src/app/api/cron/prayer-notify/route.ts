import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';

const NOTIFIABLE_PRAYERS: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

const PRAYER_LABELS: Record<PrayerName, string> = {
    Fajr: 'Subuh',
    Dhuhr: 'Dzuhur',
    Asr: 'Ashar',
    Maghrib: 'Maghrib',
    Isha: 'Isya',
};

interface LocationData {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
}

interface ProfileRow {
    id: string;
    location_data: LocationData | null;
}

function roundCoord(val: number): string {
    return val.toFixed(2);
}

function parseTimeToMinutes(timeStr: string): number {
    const clean = timeStr.replace(/\s*\(.*\)/, '');
    const [h, m] = clean.split(':').map(Number);
    return h * 60 + m;
}

function getLocalDate(timezone: string): string {
    const now = new Date();
    const parts = now.toLocaleDateString('en-CA', { timeZone: timezone }).split('-');
    return `${parseInt(parts[2])}-${parseInt(parts[1])}-${parseInt(parts[0])}`;
}

function getLocalDateKey(timezone: string): string {
    const now = new Date();
    return now.toLocaleDateString('en-CA', { timeZone: timezone });
}

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    const cronSecret = request.headers.get('x-vercel-cron-secret');
    const isAuthorized =
        authHeader === `Bearer ${process.env.CRON_SECRET}` ||
        cronSecret === process.env.CRON_SECRET;

    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const onesignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
    const onesignalApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!onesignalAppId || !onesignalApiKey) {
        return NextResponse.json({ error: 'OneSignal not configured' }, { status: 500 });
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: profiles, error } = await supabase
            .from('profiles')
            .select('id, location_data')
            .not('location_data', 'is', null);

        if (error) {
            console.error('Query error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!profiles || profiles.length === 0) {
            return NextResponse.json({ message: 'No users with location data', count: 0 });
        }

        const locationGroups = new Map<string, { lat: number; lng: number; userIds: string[] }>();

        for (const profile of profiles as ProfileRow[]) {
            if (!profile.location_data) continue;
            const key = `${roundCoord(profile.location_data.latitude)},${roundCoord(profile.location_data.longitude)}`;
            const group = locationGroups.get(key);
            if (group) {
                group.userIds.push(profile.id);
            } else {
                locationGroups.set(key, {
                    lat: profile.location_data.latitude,
                    lng: profile.location_data.longitude,
                    userIds: [profile.id],
                });
            }
        }

        const nowUtc = new Date();

        let totalSent = 0;
        const results: string[] = [];

        for (const [locKey, group] of locationGroups) {
            try {
                const res = await fetch(
                    `https://api.aladhan.com/v1/timings?latitude=${group.lat}&longitude=${group.lng}&method=11`
                );
                if (!res.ok) {
                    results.push(`${locKey}: API error ${res.status}`);
                    continue;
                }

                const json = await res.json();
                if (json.code !== 200) {
                    results.push(`${locKey}: Aladhan error ${json.code}`);
                    continue;
                }

                const timings = json.data.timings;
                const userTimezone = json.data.meta.timezone || 'UTC';

                const localTimeStr = nowUtc.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false,
                    timeZone: userTimezone,
                });
                const [localH, localM] = localTimeStr.split(':').map(Number);
                const nowMinutes = localH * 60 + localM;
                const dateKey = getLocalDateKey(userTimezone);

                for (const prayerName of NOTIFIABLE_PRAYERS) {
                    const prayerMinutes = parseTimeToMinutes(timings[prayerName]);
                    const preAdhanMinutes = prayerMinutes - 10;
                    const diff = nowMinutes - preAdhanMinutes;

                    if (diff >= 0 && diff <= 5) {
                        const dedupKey = `${dateKey}:${prayerName}`;

                        const usersToNotify: string[] = [];
                        for (const userId of group.userIds) {
                            const { data: existing } = await supabase
                                .from('prayer_notifications')
                                .select('id')
                                .eq('user_id', userId)
                                .eq('dedup_key', dedupKey)
                                .maybeSingle();

                            if (!existing) {
                                usersToNotify.push(userId);
                            }
                        }

                        if (usersToNotify.length === 0) {
                            results.push(`${locKey}: ${prayerName} already sent`);
                            continue;
                        }

                        const label = PRAYER_LABELS[prayerName];
                        const timeStr = timings[prayerName].replace(/\s*\(.*\)/, '');

                        try {
                            const notifRes = await fetch(
                                'https://onesignal.com/api/v1/notifications',
                                {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        Authorization: `Basic ${onesignalApiKey}`,
                                    },
                                    body: JSON.stringify({
                                        app_id: onesignalAppId,
                                        include_aliases: {
                                            external_id: usersToNotify,
                                        },
                                        target_channel: 'push',
                                        headings: { en: `🕌 ${label} dalam 10 menit` },
                                        contents: {
                                            en: `Waktu ${label} pukul ${timeStr}. Bersiaplah untuk shalat.`,
                                        },
                                        url: '/dashboard',
                                    }),
                                }
                            );

                            if (notifRes.ok) {
                                const rows = usersToNotify.map((uid) => ({
                                    user_id: uid,
                                    dedup_key: dedupKey,
                                    prayer_name: prayerName,
                                    sent_at: new Date().toISOString(),
                                }));
                                await supabase.from('prayer_notifications').insert(rows);

                                totalSent += usersToNotify.length;
                                results.push(`${locKey}: Sent ${label} alert to ${usersToNotify.length} users`);
                            } else {
                                const errBody = await notifRes.text();
                                results.push(`${locKey}: OneSignal error for ${label}: ${errBody}`);
                            }
                        } catch (err) {
                            results.push(`${locKey}: Send error for ${label}: ${err}`);
                        }
                    }
                }
            } catch (err) {
                results.push(`${locKey}: Fetch error: ${err}`);
            }
        }

        return NextResponse.json({
            message: `Processed ${locationGroups.size} locations, sent ${totalSent} notifications`,
            details: results,
            timestamp: nowUtc.toISOString(),
        });
    } catch (err) {
        console.error('Prayer notify cron error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Internal error' },
            { status: 500 }
        );
    }
}

