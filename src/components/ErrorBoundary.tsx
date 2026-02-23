'use client';

import React from 'react';
import Button from '@/components/ui/Button';

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends React.Component<
    ErrorBoundaryProps,
    ErrorBoundaryState
> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="page">
                    <div className="container" style={{ textAlign: 'center', paddingTop: '60px' }}>
                        <div
                            style={{
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.1em',
                                color: 'var(--danger)',
                                marginBottom: '12px',
                            }}
                        >
                            &#47;&#47; SOMETHING WENT WRONG
                        </div>
                        <p
                            style={{
                                fontSize: '12px',
                                color: 'var(--fg-muted)',
                                marginBottom: '20px',
                                maxWidth: '400px',
                                margin: '0 auto 20px',
                            }}
                        >
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <Button
                            variant="accent"
                            onClick={() => {
                                this.setState({ hasError: false, error: null });
                                window.location.reload();
                            }}
                        >
                            RELOAD PAGE
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
