import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    style?: React.CSSProperties;
}

export default function Skeleton({
    width = '100%',
    height = '20px',
    style,
}: SkeletonProps) {
    return (
        <div
            className="skeleton"
            style={{
                width,
                height,
                ...style,
            }}
        />
    );
}

export function PrayerSkeleton() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: 7 }).map((_, i) => (
                <div
                    key={i}
                    style={{
                        border: '1px solid var(--border)',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Skeleton width="80px" height="16px" />
                    <Skeleton width="50px" height="16px" />
                </div>
            ))}
        </div>
    );
}
