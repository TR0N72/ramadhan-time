import React from 'react';

interface CardProps {
    children: React.ReactNode;
    style?: React.CSSProperties;
    className?: string;
}

export default function Card({ children, style, className }: CardProps) {
    return (
        <div
            className={className}
            style={{
                border: '1px solid var(--border)',
                background: 'var(--bg)',
                padding: '16px',
                ...style,
            }}
        >
            {children}
        </div>
    );
}
