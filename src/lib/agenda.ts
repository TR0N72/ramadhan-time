import { createClient } from '@/lib/supabase/client';
import { Agenda, AgendaInsert, AgendaUpdate } from '@/types';

export async function getAgendas(userId: string): Promise<Agenda[]> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('agendas')
        .select('*')
        .eq('user_id', userId)
        .order('target_time', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function createAgenda(agenda: AgendaInsert): Promise<Agenda> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('agendas')
        .insert(agenda)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateAgenda(
    id: string,
    updates: AgendaUpdate
): Promise<Agenda> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('agendas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteAgenda(id: string): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.from('agendas').delete().eq('id', id);

    if (error) throw error;
}
