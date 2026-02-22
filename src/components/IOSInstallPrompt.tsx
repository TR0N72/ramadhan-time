'use client';

import React, { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';

function isIOS(): boolean {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
    if (typeof window === 'undefined') return false;
    return (
        ('standalone' in window.navigator &&
            (window.navigator as unknown as { standalone: boolean }).standalone) ||
        window.matchMedia('(display-mode: standalone)').matches
    );
}

function isSafari(): boolean {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent;
    return /Safari/.test(ua) && !/Chrome/.test(ua) && !/CriOS/.test(ua);
}

export default function IOSInstallPrompt() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (isIOS() && isSafari() && !isInStandaloneMode()) {
            setShow(true);
        }
    }, []);

    if (!show) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '12px 16px',
                background: 'var(--bg)',
                borderTop: '1px solid var(--accent)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 9999,
            }}
        >
            <div style={{ fontSize: '11px', lineHeight: 1.4, flex: 1, marginRight: '12px' }}>
                <span style={{ color: 'var(--accent)' }}>&#47;&#47;</span>{' '}
                To enable notifications: Tap{' '}
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Share</span>{' '}
                → <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Add to Home Screen</span>
            </div>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setShow(false)}
                style={{ flexShrink: 0 }}
            >
                ✕
            </Button>
        </div>
    );
}
