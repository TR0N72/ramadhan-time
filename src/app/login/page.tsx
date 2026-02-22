'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        const supabase = createClient();

        try {
            if (isSignUp) {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                });
                if (signUpError) throw signUpError;
                setMessage('Check your email for a confirmation link.');
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
                router.push('/dashboard');
                router.refresh();
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Authentication failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container">
                <div
                    style={{
                        maxWidth: '380px',
                        margin: '0 auto',
                        paddingTop: '60px',
                    }}
                >
                    <div style={{ marginBottom: '32px' }}>
                        <Link
                            href="/"
                            style={{
                                fontSize: '11px',
                                color: 'var(--fg-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                marginBottom: '16px',
                                display: 'block',
                            }}
                        >
                            ← BACK
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
                            {isSignUp ? 'SIGN UP' : 'LOGIN'}
                        </h1>
                        <p
                            style={{
                                fontSize: '11px',
                                color: 'var(--fg-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                            }}
                        >
                            &#47;&#47; {isSignUp ? 'CREATE YOUR ACCOUNT' : 'ACCESS YOUR DASHBOARD'}
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        style={{
                            border: '1px solid var(--border)',
                            padding: '24px',
                        }}
                    >
                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />

                        {error && (
                            <div
                                style={{
                                    border: '1px solid var(--danger)',
                                    padding: '10px',
                                    marginBottom: '16px',
                                    fontSize: '12px',
                                    color: 'var(--danger)',
                                }}
                            >
                                {error}
                            </div>
                        )}

                        {message && (
                            <div
                                style={{
                                    border: '1px solid var(--accent)',
                                    padding: '10px',
                                    marginBottom: '16px',
                                    fontSize: '12px',
                                    color: 'var(--accent)',
                                }}
                            >
                                {message}
                            </div>
                        )}

                        <Button
                            type="submit"
                            variant="accent"
                            loading={loading}
                            style={{ width: '100%', marginBottom: '12px' }}
                        >
                            {isSignUp ? 'CREATE ACCOUNT' : 'LOG IN'}
                        </Button>

                        <button
                            type="button"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                                setMessage(null);
                            }}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--fg-muted)',
                                fontSize: '11px',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                fontFamily: 'var(--font-mono)',
                                width: '100%',
                                textAlign: 'center',
                            }}
                        >
                            {isSignUp
                                ? 'Already have an account? LOG IN'
                                : "Don't have an account? SIGN UP"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
