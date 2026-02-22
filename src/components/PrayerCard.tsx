'use client';

import React from 'react';
import { PrayerTime } from '@/types';

interface PrayerCardProps {
    prayer: PrayerTime;
    isNext: boolean;
    isPreAdhan: boolean;
}

export default function PrayerCard({ prayer, isNext, isPreAdhan }: PrayerCardProps) {
    const isPast = prayer.timestamp < Date.now();

    return (
        <div
            style={{
                border: `1px solid ${isNext ? 'var(--accent)' : 'var(--border)'}`,
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: isNext ? 'var(--accent-dim)' : 'transparent',
                opacity: isPast && !isNext ? 0.4 : 1,
                transition: 'all var(--transition-speed) ease',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                    style={{
                        fontSize: '13px',
                        fontWeight: isNext ? 700 : 400,
                        color: isNext ? 'var(--accent)' : 'var(--fg)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        minWidth: '80px',
                    }}
                >
                    {prayer.name}
                </span>
                {isNext && (
                    <span
                        style={{
                            fontSize: '9px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'var(--accent)',
                            border: '1px solid var(--accent)',
                            padding: '2px 6px',
                        }}
                    >
                        NEXT
                    </span>
                )}
                {isPreAdhan && (
                    <span
                        style={{
                            fontSize: '9px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            color: 'var(--warning)',
                            border: '1px solid var(--warning)',
                            padding: '2px 6px',
                        }}
                    >
                        -10 MIN
                    </span>
                )}
            </div>
            <div style={{ textAlign: 'right' }}>
                <span
                    style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        fontVariantNumeric: 'tabular-nums',
                        color: isNext ? 'var(--accent)' : 'var(--fg)',
                    }}
                >
                    {prayer.time}
                </span>
                {isNext && (
                    <div
                        style={{
                            fontSize: '10px',
                            color: 'var(--fg-muted)',
                            marginTop: '2px',
                        }}
                    >
                        alert at {prayer.preAdhanTime}
                    </div>
                )}
            </div>
        </div>
    );
}
