'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Agenda } from '@/types';
import {
    getAgendas,
    createAgenda,
    updateAgenda,
    deleteAgenda,
} from '@/lib/agenda';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface AgendaListProps {
    userId: string;
}

export default function AgendaList({ userId }: AgendaListProps) {
    const [agendas, setAgendas] = useState<Agenda[]>([]);
    const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [taskName, setTaskName] = useState('');
    const [targetTime, setTargetTime] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editTime, setEditTime] = useState('');

    const loadAgendas = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAgendas(userId);
            setAgendas(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load agendas');
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        loadAgendas();
    }, [loadAgendas]);

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel('agendas-realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'agendas',
                    filter: `user_id=eq.${userId}`,
                },
                (payload) => {
                    if (payload.eventType === 'INSERT') {
                        const newItem = payload.new as Agenda;
                        setFlashIds((prev) => new Set(prev).add(newItem.id));
                        setTimeout(() => {
                            setFlashIds((prev) => {
                                const next = new Set(prev);
                                next.delete(newItem.id);
                                return next;
                            });
                        }, 600);
                        setAgendas((prev) => {
                            if (prev.find((a) => a.id === newItem.id))
                                return prev;
                            return [...prev, newItem].sort(
                                (a, b) =>
                                    new Date(a.target_time).getTime() -
                                    new Date(b.target_time).getTime()
                            );
                        });
                    } else if (payload.eventType === 'UPDATE') {
                        setAgendas((prev) =>
                            prev.map((a) =>
                                a.id === (payload.new as Agenda).id
                                    ? (payload.new as Agenda)
                                    : a
                            )
                        );
                    } else if (payload.eventType === 'DELETE') {
                        setAgendas((prev) =>
                            prev.filter((a) => a.id !== (payload.old as Agenda).id)
                        );
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskName.trim() || !targetTime) return;

        if (taskName.trim().length > 100) {
            setError('Task name must be 100 characters or fewer');
            return;
        }

        const targetDate = new Date(targetTime);
        if (targetDate.getTime() <= Date.now()) {
            setError('Target time must be in the future');
            return;
        }

        try {
            await createAgenda({
                user_id: userId,
                task_name: taskName.trim(),
                target_time: targetDate.toISOString(),
            });
            setTaskName('');
            setTargetTime('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create agenda');
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim() || !editTime) return;

        try {
            await updateAgenda(id, {
                task_name: editName.trim(),
                target_time: new Date(editTime).toISOString(),
            });
            setEditingId(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update agenda');
        }
    };

    const handleDelete = async (id: string) => {
        const prev = agendas;
        setAgendas((a) => a.filter((item) => item.id !== id));
        try {
            await deleteAgenda(id);
        } catch (err) {
            setAgendas(prev);
            setError(err instanceof Error ? err.message : 'Failed to delete agenda');
        }
    };

    const startEdit = (agenda: Agenda) => {
        setEditingId(agenda.id);
        setEditName(agenda.task_name);
        const dt = new Date(agenda.target_time);
        setEditTime(dt.toISOString().slice(0, 16));
    };

    return (
        <div>
            <div
                style={{
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    color: 'var(--fg-muted)',
                    marginBottom: '12px',
                }}
            >
                &#47;&#47; DAILY AGENDA
            </div>

            <form
                onSubmit={handleCreate}
                style={{
                    border: '1px solid var(--border)',
                    padding: '16px',
                    marginBottom: '12px',
                }}
            >
                <Input
                    placeholder="Task name..."
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                />
                <Input
                    type="datetime-local"
                    value={targetTime}
                    onChange={(e) => setTargetTime(e.target.value)}
                    style={{
                        colorScheme: 'dark',
                    }}
                />
                <Button type="submit" variant="accent" size="sm">
                    + ADD TASK
                </Button>
            </form>

            {error && (
                <div
                    style={{
                        border: '1px solid var(--danger)',
                        padding: '10px',
                        marginBottom: '12px',
                        fontSize: '12px',
                        color: 'var(--danger)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <span>{error}</span>
                    <Button variant="danger" size="sm" onClick={() => setError(null)}>
                        DISMISS
                    </Button>
                </div>
            )}

            {loading ? (
                <div style={{ color: 'var(--fg-muted)', fontSize: '12px', padding: '20px', textAlign: 'center' }}>
                    Loading agendas...
                </div>
            ) : agendas.length === 0 ? (
                <div
                    style={{
                        border: '1px solid var(--border)',
                        padding: '30px',
                        textAlign: 'center',
                        color: 'var(--fg-muted)',
                        fontSize: '12px',
                    }}
                >
                    No agenda items. Add a task above.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {agendas.map((agenda) => (
                        <div
                            key={agenda.id}
                            className={flashIds.has(agenda.id) ? 'flash-update' : ''}
                            style={{
                                border: '1px solid var(--border)',
                                padding: '12px 16px',
                            }}
                        >
                            {editingId === agenda.id ? (
                                <div>
                                    <Input
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Task name..."
                                    />
                                    <Input
                                        type="datetime-local"
                                        value={editTime}
                                        onChange={(e) => setEditTime(e.target.value)}
                                        style={{ colorScheme: 'dark' }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <Button
                                            variant="accent"
                                            size="sm"
                                            onClick={() => handleUpdate(agenda.id)}
                                        >
                                            SAVE
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setEditingId(null)}
                                        >
                                            CANCEL
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div>
                                        <div
                                            style={{
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                marginBottom: '4px',
                                                textDecoration: agenda.is_notified
                                                    ? 'line-through'
                                                    : 'none',
                                                opacity: agenda.is_notified ? 0.5 : 1,
                                            }}
                                        >
                                            {agenda.task_name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--fg-muted)' }}>
                                            {new Date(agenda.target_time).toLocaleString()}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => startEdit(agenda)}
                                        >
                                            EDIT
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(agenda.id)}
                                        >
                                            DEL
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
