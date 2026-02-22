'use client';

import React from 'react';
import LocationProvider from '@/components/LocationProvider';
import PrayerTimesDisplay from '@/components/PrayerTimesDisplay';
import Link from 'next/link';

export default function Home() {
  return (
    <LocationProvider>
      <div className="page">
        <div className="container">
          <header
            style={{
              borderBottom: '1px solid var(--border)',
              paddingBottom: '16px',
              marginBottom: '24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.15em',
                  marginBottom: '4px',
                }}
              >
                RAMADHAN TIME
              </h1>
              <p
                style={{
                  fontSize: '11px',
                  color: 'var(--fg-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                &#47;&#47; PRAYER TIMES COMPANION
              </p>
            </div>
            <Link
              href="/login"
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                border: '1px solid var(--border)',
                padding: '6px 14px',
                color: 'var(--fg)',
                transition: 'all var(--transition-speed) ease',
              }}
            >
              LOGIN →
            </Link>
          </header>

          <section>
            <PrayerTimesDisplay />
          </section>

          <footer
            style={{
              marginTop: '40px',
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
              Data from Aladhan API • Times may vary ±1 min
            </p>
          </footer>
        </div>
      </div>
    </LocationProvider>
  );
}
