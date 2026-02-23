'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { CITIES } from '@/lib/cities';
import { LocationData, CityOption } from '@/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Link from 'next/link';

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [username, setUsername] = useState('');
    const [location, setLocation] = useState<LocationData | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const router = useRouter();

    const [hijriAdjustment, setHijriAdjustment] = useState(0);
    const [adminSecret, setAdminSecret] = useState('');
    const [hijriSaving, setHijriSaving] = useState(false);
    const [hijriMessage, setHijriMessage] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser().then(async ({ data: { user } }) => {
            if (!user) {
                router.push('/login');
                return;
            }
            setUser(user);

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUsername(profile.username || '');
                setLocation(profile.location_data);
            }

            const saved = localStorage.getItem('ramadhan-time-location');
            if (saved && !profile?.location_data) {
                try {
                    setLocation(JSON.parse(saved));
                } catch {
                }
            }

            setLoading(false);
        });

        fetch('/api/hijri-offset')
            .then((res) => res.json())
            .then((data) => setHijriAdjustment(data.adjustment ?? 0))
            .catch(() => { });
    }, [router]);

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setMessage(null);

        const supabase = createClient();

        try {
            const { error } = await supabase.from('profiles').upsert({
                id: user.id,
                username: username.trim() || null,
                location_data: location,
                updated_at: new Date().toISOString(),
            });

            if (error) throw error;

            if (location) {
                localStorage.setItem('ramadhan-time-location', JSON.stringify(location));
            }

            setMessage('Settings saved.');
        } catch (err) {
            setMessage(
                `Error: ${err instanceof Error ? err.message : 'Failed to save'}`
            );
        } finally {
            setSaving(false);
        }
    };

    const handleHijriSave = async () => {
        setHijriSaving(true);
        setHijriMessage(null);

        try {
            const res = await fetch('/api/hijri-offset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${adminSecret}`,
                },
                body: JSON.stringify({ adjustment: hijriAdjustment }),
            });

            const data = await res.json();
            if (!res.ok) {
                setHijriMessage(`Error: ${data.error}`);
            } else {
                setHijriMessage(`Offset set to ${hijriAdjustment}`);
            }
        } catch {
            setHijriMessage('Error: Failed to update');
        } finally {
            setHijriSaving(false);
        }
    };

    const selectCity = (city: CityOption) => {
        const loc: LocationData = {
            latitude: city.latitude,
            longitude: city.longitude,
            city: city.city,
            country: city.country,
        };
        setLocation(loc);
        setSearch('');
    };

    const filtered = search
        ? CITIES.filter(
            (c) =>
                c.city.toLowerCase().includes(search.toLowerCase()) ||
                c.country.toLowerCase().includes(search.toLowerCase())
        )
        : [];

    if (loading) {
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
        <div className="page">
            <div className="container" style={{ maxWidth: '480px' }}>
                <div style={{ marginBottom: '24px' }}>
                    <Link
                        href="/dashboard"
                        style={{
                            fontSize: '11px',
                            color: 'var(--fg-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            marginBottom: '16px',
                            display: 'block',
                        }}
                    >
                        ← DASHBOARD
                    </Link>
                    <h1
                        style={{
                            fontSize: '18px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            marginBottom: '4px',
                        }}
                    >
                        SETTINGS
                    </h1>
                    <p
                        style={{
                            fontSize: '11px',
                            color: 'var(--fg-muted)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                        }}
                    >
                        &#47;&#47; PROFILE & PREFERENCES
                    </p>
                </div>

                <Card style={{ marginBottom: '16px' }}>
                    <div
                        style={{
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'var(--fg-muted)',
                            marginBottom: '16px',
                        }}
                    >
                        &#47;&#47; PROFILE
                    </div>
                    <Input
                        label="Username"
                        placeholder="your_name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <div style={{ fontSize: '11px', color: 'var(--fg-muted)' }}>
                        Email: {user?.email}
                    </div>
                </Card>

                <Card style={{ marginBottom: '16px' }}>
                    <div
                        style={{
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'var(--fg-muted)',
                            marginBottom: '16px',
                        }}
                    >
                        &#47;&#47; LOCATION
                    </div>
                    {location && (
                        <div
                            style={{
                                fontSize: '12px',
                                marginBottom: '12px',
                                padding: '10px',
                                border: '1px solid var(--accent)',
                                background: 'var(--accent-dim)',
                            }}
                        >
                            <span style={{ color: 'var(--accent)' }}>{location.city}</span>
                            {location.country && (
                                <span style={{ color: 'var(--fg-muted)' }}>
                                    , {location.country}
                                </span>
                            )}
                            <div style={{ fontSize: '10px', color: 'var(--fg-muted)', marginTop: '4px' }}>
                                {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                            </div>
                        </div>
                    )}
                    <Input
                        placeholder="Search city to change..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {filtered.length > 0 && (
                        <div
                            style={{
                                border: '1px solid var(--border)',
                                maxHeight: '200px',
                                overflow: 'auto',
                                marginBottom: '12px',
                            }}
                        >
                            {filtered.map((city) => (
                                <button
                                    key={`${city.city}-${city.country}`}
                                    onClick={() => selectCity(city)}
                                    style={{
                                        display: 'block',
                                        width: '100%',
                                        padding: '8px 12px',
                                        background: 'transparent',
                                        color: 'var(--fg)',
                                        border: 'none',
                                        borderBottom: '1px solid var(--border)',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '12px',
                                    }}
                                >
                                    <span style={{ color: 'var(--accent)' }}>{city.city}</span>
                                    <span style={{ color: 'var(--fg-muted)', marginLeft: '8px' }}>
                                        {city.country}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}
                </Card>

                <Card style={{ marginBottom: '16px' }}>
                    <div
                        style={{
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'var(--fg-muted)',
                            marginBottom: '16px',
                        }}
                    >
                        &#47;&#47; HIJRI DATE ADJUSTMENT (ADMIN)
                    </div>
                    <div
                        style={{
                            fontSize: '10px',
                            color: 'var(--fg-muted)',
                            marginBottom: '12px',
                        }}
                    >
                        Adjust Hijri date to match Sidang Isbat. Current offset applied globally.
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '12px',
                        }}
                    >
                        <button
                            onClick={() => setHijriAdjustment((v) => Math.max(-2, v - 1))}
                            style={{
                                width: '36px',
                                height: '36px',
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--fg)',
                                fontSize: '18px',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono)',
                            }}
                        >
                            −
                        </button>
                        <div
                            style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: hijriAdjustment === 0 ? 'var(--fg-muted)' : 'var(--accent)',
                                minWidth: '40px',
                                textAlign: 'center',
                                fontVariantNumeric: 'tabular-nums',
                            }}
                        >
                            {hijriAdjustment > 0 ? `+${hijriAdjustment}` : hijriAdjustment}
                        </div>
                        <button
                            onClick={() => setHijriAdjustment((v) => Math.min(2, v + 1))}
                            style={{
                                width: '36px',
                                height: '36px',
                                border: '1px solid var(--border)',
                                background: 'transparent',
                                color: 'var(--fg)',
                                fontSize: '18px',
                                cursor: 'pointer',
                                fontFamily: 'var(--font-mono)',
                            }}
                        >
                            +
                        </button>
                    </div>
                    <Input
                        label="Admin Secret"
                        placeholder="Enter secret to save..."
                        value={adminSecret}
                        onChange={(e) => setAdminSecret(e.target.value)}
                    />
                    {hijriMessage && (
                        <div
                            style={{
                                fontSize: '11px',
                                marginTop: '8px',
                                color: hijriMessage.startsWith('Error') ? 'var(--danger)' : 'var(--accent)',
                            }}
                        >
                            {hijriMessage}
                        </div>
                    )}
                    <Button
                        variant="accent"
                        size="sm"
                        onClick={handleHijriSave}
                        loading={hijriSaving}
                        style={{ width: '100%', marginTop: '12px' }}
                    >
                        SAVE HIJRI OFFSET
                    </Button>
                </Card>

                {message && (
                    <div
                        style={{
                            border: `1px solid ${message.startsWith('Error') ? 'var(--danger)' : 'var(--accent)'}`,
                            padding: '10px',
                            marginBottom: '12px',
                            fontSize: '12px',
                            color: message.startsWith('Error')
                                ? 'var(--danger)'
                                : 'var(--accent)',
                        }}
                    >
                        {message}
                    </div>
                )}
                <Button
                    variant="accent"
                    onClick={handleSave}
                    loading={saving}
                    style={{ width: '100%' }}
                >
                    SAVE SETTINGS
                </Button>
            </div>
        </div>
    );
}
