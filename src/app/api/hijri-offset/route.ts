import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
            .from('app_settings')
            .select('value')
            .eq('key', 'hijri_adjustment')
            .maybeSingle();

        if (error) {
            console.error('Failed to read hijri_adjustment:', error);
            return NextResponse.json({ adjustment: 0 });
        }

        const adjustment = data ? Number(data.value) : 0;
        return NextResponse.json({ adjustment });
    } catch {
        return NextResponse.json({ adjustment: 0 });
    }
}

export async function POST(request: Request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const adjustment = Number(body.adjustment);

        if (isNaN(adjustment) || adjustment < -2 || adjustment > 2) {
            return NextResponse.json(
                { error: 'Adjustment must be between -2 and 2' },
                { status: 400 }
            );
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await supabase
            .from('app_settings')
            .upsert({
                key: 'hijri_adjustment',
                value: String(adjustment),
                updated_at: new Date().toISOString(),
            });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ adjustment, message: 'Updated' });
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Internal error' },
            { status: 500 }
        );
    }
}
