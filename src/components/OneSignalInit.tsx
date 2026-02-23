'use client';

import React, { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

let initialized = false;

export default function OneSignalInit() {
    useEffect(() => {
        const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
        if (!appId || appId === 'your-onesignal-app-id') return;
        if (initialized) return;

        const initOneSignal = async () => {
            try {
                initialized = true;
                const OneSignal = (await import('react-onesignal')).default;
                await OneSignal.init({
                    appId,
                    allowLocalhostAsSecureOrigin: true,
                });

                await OneSignal.Slidedown.promptPush();

                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await OneSignal.login(user.id);

                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('location_data')
                        .eq('id', user.id)
                        .single();

                    if (profile?.location_data) {
                        await OneSignal.User.addTags({
                            latitude: String(profile.location_data.latitude),
                            longitude: String(profile.location_data.longitude),
                            city: profile.location_data.city || '',
                        });
                    }
                }
            } catch (err) {
                initialized = false;
                console.error('OneSignal init failed:', err);
            }
        };

        initOneSignal();
    }, []);

    return null;
}
