'use client';

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

const inputStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '13px',
    padding: '10px 12px',
    border: '1px solid var(--border)',
    background: 'transparent',
    color: 'var(--fg)',
    width: '100%',
    outline: 'none',
    transition: 'border-color var(--transition-speed) ease',
};

const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--font-mono)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'var(--fg-muted)',
    marginBottom: '6px',
    display: 'block',
};

export default function Input({ label, style, ...props }: InputProps) {
    const [focused, setFocused] = React.useState(false);

    return (
        <div style={{ marginBottom: '16px' }}>
            {label && <label style={labelStyle}>{label}</label>}
            <input
                style={{
                    ...inputStyle,
                    borderColor: focused ? 'var(--accent)' : 'var(--border)',
                    ...style,
                }}
                onFocus={(e) => {
                    setFocused(true);
                    props.onFocus?.(e);
                }}
                onBlur={(e) => {
                    setFocused(false);
                    props.onBlur?.(e);
                }}
                {...props}
            />
        </div>
    );
}
