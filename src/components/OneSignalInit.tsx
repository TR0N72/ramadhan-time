'use client';

import React, { useEffect } from 'react';

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
            } catch (err) {
                console.error('OneSignal init failed:', err);
            }
        };

        initOneSignal();
    }, []);

    return null;
}
