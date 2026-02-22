'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'accent' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
}

const styles: Record<string, React.CSSProperties> = {
    base: {
        fontFamily: 'var(--font-mono)',
        border: '1px solid var(--border)',
        background: 'transparent',
        color: 'var(--fg)',
        cursor: 'pointer',
        transition: 'all var(--transition-speed) ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        fontWeight: 500,
    },
    sm: { padding: '4px 12px', fontSize: '11px' },
    md: { padding: '8px 20px', fontSize: '12px' },
    lg: { padding: '12px 28px', fontSize: '13px' },
    accent: { borderColor: 'var(--accent)', color: 'var(--accent)' },
    danger: { borderColor: 'var(--danger)', color: 'var(--danger)' },
    ghost: { border: 'none', color: 'var(--fg-muted)' },
    disabled: { opacity: 0.4, cursor: 'not-allowed' },
};

export default function Button({
    variant = 'default',
    size = 'md',
    loading = false,
    disabled,
    style,
    children,
    onMouseDown,
    onMouseUp,
    ...props
}: ButtonProps) {
    const [pressed, setPressed] = React.useState(false);

    const variantStyle = variant !== 'default' ? styles[variant] : {};
    const sizeStyle = styles[size];
    const pressedStyle: React.CSSProperties = pressed
        ? { transform: 'scale(0.97)', opacity: 0.8 }
        : {};
    const disabledStyle = disabled || loading ? styles.disabled : {};

    return (
        <button
            disabled={disabled || loading}
            style={{
                ...styles.base,
                ...sizeStyle,
                ...variantStyle,
                ...pressedStyle,
                ...disabledStyle,
                ...style,
            }}
            onMouseDown={(e) => {
                setPressed(true);
                onMouseDown?.(e);
            }}
            onMouseUp={(e) => {
                setPressed(false);
                onMouseUp?.(e);
            }}
            onMouseLeave={() => setPressed(false)}
            {...props}
        >
            {loading ? '...' : children}
        </button>
    );
}
