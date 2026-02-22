import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const now = new Date();
        const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);

        const { data: agendas, error } = await supabase
            .from('agendas')
            .select('*, profiles!inner(username)')
            .eq('is_notified', false)
            .gte('target_time', oneMinuteAgo.toISOString())
            .lte('target_time', now.toISOString());

        if (error) {
            console.error('Query error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        if (!agendas || agendas.length === 0) {
            return NextResponse.json({ message: 'No pending notifications', count: 0 });
        }

        const onesignalAppId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
        const onesignalApiKey = process.env.ONESIGNAL_REST_API_KEY;

        if (!onesignalAppId || !onesignalApiKey) {
            console.warn('OneSignal not configured, skipping push notifications');
            const ids = agendas.map((a) => a.id);
            await supabase
                .from('agendas')
                .update({ is_notified: true })
                .in('id', ids);

            return NextResponse.json({
                message: 'Marked as notified (OneSignal not configured)',
                count: agendas.length,
            });
        }

        let sentCount = 0;
        for (const agenda of agendas) {
            try {
                const response = await fetch(
                    'https://onesignal.com/api/v1/notifications',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Basic ${onesignalApiKey}`,
                        },
                        body: JSON.stringify({
                            app_id: onesignalAppId,
                            filters: [
                                {
                                    field: 'tag',
                                    key: 'user_id',
                                    relation: '=',
                                    value: agenda.user_id,
                                },
                            ],
                            headings: { en: 'Ramadhan Time' },
                            contents: {
                                en: `⏰ ${agenda.task_name}`,
                            },
                            url: '/dashboard',
                        }),
                    }
                );

                if (response.ok) {
                    sentCount++;
                }
            } catch (err) {
                console.error(`Failed to send notification for agenda ${agenda.id}:`, err);
            }
        }

        const ids = agendas.map((a) => a.id);
        await supabase
            .from('agendas')
            .update({ is_notified: true })
            .in('id', ids);

        return NextResponse.json({
            message: `Sent ${sentCount}/${agendas.length} notifications`,
            count: sentCount,
        });
    } catch (err) {
        console.error('Cron error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Internal error' },
            { status: 500 }
        );
    }
}
