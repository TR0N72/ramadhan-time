'use client';

import React, { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function OneSignalInit() {
    useEffect(() => {
        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
        if (!appId || appId === 'your-onesignal-app-id') return;

        const initOneSignal = async () => {
            try {
                const OneSignal = (await import('react-onesignal')).default;
                await OneSignal.init({
                    appId,
                    allowLocalhostAsSecureOrigin: true,
                });

                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await OneSignal.sendTag('user_id', user.id);
                }
            } catch (err) {
                console.error('OneSignal init failed:', err);
            }
        };

        initOneSignal();
    }, []);

    return null;
}
