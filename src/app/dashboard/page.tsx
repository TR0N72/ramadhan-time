'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import LocationProvider from '@/components/LocationProvider';
import PrayerTimesDisplay from '@/components/PrayerTimesDisplay';
import AgendaList from '@/components/AgendaList';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);
        });
    }, []);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/');
        router.refresh();
    };

    if (loading || !user) {
        return (
            <div className="page">
                <div className="container">
                    <div style={{ color: 'var(--fg-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        &#47;&#47; LOADING...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <LocationProvider>
            <div className="page">
                <div className="container">
                    <header
                        style={{
                            borderBottom: '1px solid var(--border)',
                            paddingBottom: '16px',
                            marginBottom: '24px',
                        }}
                    >
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '8px',
                            }}
                        >
                            <h1
                                style={{
                                    fontSize: '18px',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                }}
                            >
                                DASHBOARD
                            </h1>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Link
                                    href="/settings"
                                    style={{
                                        fontSize: '11px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        border: '1px solid var(--border)',
                                        padding: '6px 14px',
                                        color: 'var(--fg)',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    SETTINGS
                                </Link>
                                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                                    LOGOUT
                                </Button>
                            </div>
                        </div>
                        <p
                            style={{
                                fontSize: '11px',
                                color: 'var(--fg-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                            }}
                        >
                            &#47;&#47; {user.email}
                        </p>
                    </header>

                    <section style={{ marginBottom: '32px' }}>
                        <PrayerTimesDisplay />
                    </section>

                    <section style={{ marginBottom: '32px' }}>
                        <AgendaList userId={user.id} />
                    </section>

                    <footer
                        style={{
                            paddingTop: '16px',
                            borderTop: '1px solid var(--border)',
                            textAlign: 'center',
                        }}
                    >
                        <p
                            style={{
                                fontSize: '10px',
                                color: 'var(--fg-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                            }}
                        >
                            RAMADHAN TIME • PWA
                        </p>
                    </footer>
                </div>
            </div>
        </LocationProvider>
    );
}
