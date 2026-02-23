'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { PrayerSchedule } from '@/types';
import { fetchPrayerTimes, getNextPrayer, getCountdown } from '@/lib/prayer';
import { useLocation } from '@/components/LocationProvider';
import PrayerCard from '@/components/PrayerCard';
import { PrayerSkeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';

function getCacheKey(lat: number, lng: number): string {
    const today = new Date().toISOString().split('T')[0];
    return `prayer-cache-${today}-${lat.toFixed(2)}-${lng.toFixed(2)}`;
}

export default function PrayerTimesDisplay() {
    const { location } = useLocation();
    const [schedule, setSchedule] = useState<PrayerSchedule | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState('--:--:--');
    const [now, setNow] = useState(0);

    useEffect(() => {
        setNow(Date.now());
    }, []);

    const loadPrayerTimes = useCallback(async () => {
        if (!location) return;
        setLoading(true);
        setError(null);

        const cacheKey = getCacheKey(location.latitude, location.longitude);
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached) as PrayerSchedule;
                setSchedule(parsed);
                setLoading(false);
                return;
            } catch {
                localStorage.removeItem(cacheKey);
            }
        }

        try {
            const data = await fetchPrayerTimes(location.latitude, location.longitude);
            setSchedule(data);
            localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load prayer times');
        } finally {
            setLoading(false);
        }
    }, [location]);

    useEffect(() => {
        loadPrayerTimes();
    }, [loadPrayerTimes]);

    useEffect(() => {
        if (!schedule) return;

        const interval = setInterval(() => {
            const next = getNextPrayer(schedule.prayers);
            if (next) {
                setCountdown(getCountdown(next.timestamp));
            } else {
                setCountdown('00:00:00');
            }
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [schedule]);

    const nextPrayer = schedule ? getNextPrayer(schedule.prayers) : null;

    if (loading) {
        return (
            <div>
                <div
                    style={{
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: 'var(--fg-muted)',
                        marginBottom: '12px',
                    }}
                >
                    &#47;&#47; LOADING PRAYER TIMES...
                </div>
                <PrayerSkeleton />
            </div>
        );
    }

    if (error) {
        return (
            <div
                style={{
                    border: '1px solid var(--danger)',
                    padding: '20px',
                    textAlign: 'center',
                }}
            >
                <p style={{ color: 'var(--danger)', fontSize: '12px', marginBottom: '12px' }}>
                    {error}
                </p>
                <Button variant="danger" size="sm" onClick={loadPrayerTimes}>
                    RETRY
                </Button>
            </div>
        );
    }

    if (!schedule) return null;

    return (
        <div suppressHydrationWarning>
            <div
                style={{
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: '16px',
                    marginBottom: '16px',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '8px',
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: 'var(--fg-muted)',
                                marginBottom: '4px',
                            }}
                        >
                            &#47;&#47; PRAYER SCHEDULE
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>
                            {schedule.hijriDate}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: 'var(--fg-muted)' }}>
                            {schedule.date}
                        </div>
                    </div>
                </div>

                {nextPrayer && (
                    <div style={{ marginTop: '12px' }}>
                        <div
                            style={{
                                fontSize: '10px',
                                color: 'var(--fg-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                marginBottom: '4px',
                            }}
                        >
                            NEXT: {nextPrayer.name}
                        </div>
                        <div
                            suppressHydrationWarning
                            style={{
                                fontSize: '28px',
                                fontWeight: 700,
                                color: 'var(--accent)',
                                fontVariantNumeric: 'tabular-nums',
                                letterSpacing: '0.05em',
                            }}
                        >
                            {now > 0 ? countdown : '--:--:--'}
                        </div>
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {schedule.prayers.map((prayer) => {
                    const isNext = nextPrayer?.name === prayer.name;
                    const isPreAdhan =
                        now > 0 &&
                        now >= prayer.preAdhanTimestamp &&
                        now < prayer.timestamp;

                    return (
                        <PrayerCard
                            key={prayer.name}
                            prayer={prayer}
                            isNext={isNext}
                            isPreAdhan={isPreAdhan}
                        />
                    );
                })}
            </div>
        </div>
    );
}
