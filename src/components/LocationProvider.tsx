'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LocationData, CityOption } from '@/types';
import { CITIES } from '@/lib/cities';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface LocationContextType {
    location: LocationData | null;
    loading: boolean;
    error: string | null;
    retry: () => void;
}

const LocationContext = createContext<LocationContextType>({
    location: null,
    loading: true,
    error: null,
    retry: () => { },
});

export function useLocation() {
    return useContext(LocationContext);
}

function CitySelector({
    onSelect,
}: {
    onSelect: (city: CityOption) => void;
}) {
    const [search, setSearch] = useState('');
    const filtered = CITIES.filter(
        (c) =>
            c.city.toLowerCase().includes(search.toLowerCase()) ||
            c.country.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div
            style={{
                border: '1px solid var(--border)',
                padding: '20px',
                maxWidth: '400px',
                margin: '0 auto',
            }}
        >
            <div
                style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--fg-muted)',
                    marginBottom: '12px',
                }}
            >
                &#47;&#47; SELECT YOUR CITY
            </div>
            <Input
                placeholder="Search city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
            <div
                style={{
                    maxHeight: '300px',
                    overflow: 'auto',
                    border: '1px solid var(--border)',
                }}
            >
                {filtered.map((city) => (
                    <button
                        key={`${city.city}-${city.country}`}
                        onClick={() => onSelect(city)}
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: '10px 12px',
                            background: 'transparent',
                            color: 'var(--fg)',
                            border: 'none',
                            borderBottom: '1px solid var(--border)',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontFamily: 'var(--font-mono)',
                            fontSize: '12px',
                            transition: 'background var(--transition-speed) ease',
                        }}
                        onMouseEnter={(e) =>
                            (e.currentTarget.style.background = 'var(--accent-dim)')
                        }
                        onMouseLeave={(e) =>
                            (e.currentTarget.style.background = 'transparent')
                        }
                    >
                        <span style={{ color: 'var(--accent)' }}>{city.city}</span>
                        <span style={{ color: 'var(--fg-muted)', marginLeft: '8px' }}>
                            {city.country}
                        </span>
                    </button>
                ))}
                {filtered.length === 0 && (
                    <div
                        style={{
                            padding: '20px',
                            textAlign: 'center',
                            color: 'var(--fg-muted)',
                            fontSize: '12px',
                        }}
                    >
                        No cities found
                    </div>
                )}
            </div>
        </div>
    );
}

export default function LocationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [location, setLocation] = useState<LocationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFallback, setShowFallback] = useState(false);

    const getLocation = useCallback(() => {
        setLoading(true);
        setError(null);
        setShowFallback(false);

        const saved = localStorage.getItem('ramadhan-time-location');
        if (saved) {
            try {
                const parsed = JSON.parse(saved) as LocationData;
                setLocation(parsed);
                setLoading(false);
                return;
            } catch {
                localStorage.removeItem('ramadhan-time-location');
            }
        }

        if (!navigator.geolocation) {
            setShowFallback(true);
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const loc: LocationData = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    city: 'Current Location',
                    country: '',
                };

                try {
                    const res = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${loc.latitude}&longitude=${loc.longitude}&localityLanguage=en`
                    );
                    if (res.ok) {
                        const data = await res.json();
                        loc.city = data.city || data.locality || 'Current Location';
                        loc.country = data.countryName || '';
                    }
                } catch {
                }

                localStorage.setItem('ramadhan-time-location', JSON.stringify(loc));
                setLocation(loc);
                setLoading(false);
            },
            () => {
                setShowFallback(true);
                setLoading(false);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
        );
    }, []);

    useEffect(() => {
        getLocation();
    }, [getLocation]);

    const handleCitySelect = (city: CityOption) => {
        const loc: LocationData = {
            latitude: city.latitude,
            longitude: city.longitude,
            city: city.city,
            country: city.country,
        };
        localStorage.setItem('ramadhan-time-location', JSON.stringify(loc));
        setLocation(loc);
        setShowFallback(false);
    };

    if (loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    flexDirection: 'column',
                    gap: '16px',
                }}
            >
                <div style={{ color: 'var(--fg-muted)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    &#47;&#47; ACQUIRING LOCATION...
                </div>
            </div>
        );
    }

    if (showFallback && !location) {
        return (
            <div className="page">
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <h1
                            style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                marginBottom: '8px',
                            }}
                        >
                            RAMADHAN TIME
                        </h1>
                        <p
                            style={{
                                color: 'var(--fg-muted)',
                                fontSize: '12px',
                            }}
                        >
                            Location access denied. Select your city manually.
                        </p>
                    </div>
                    <CitySelector onSelect={handleCitySelect} />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="page">
                <div className="container" style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--danger)', marginBottom: '16px' }}>{error}</p>
                    <Button variant="accent" onClick={getLocation}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <LocationContext.Provider value={{ location, loading, error, retry: getLocation }}>
            {children}
        </LocationContext.Provider>
    );
}
