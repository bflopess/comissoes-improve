import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { id, newDate } = body;

        if (!id || !newDate) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const newInstallment = await db.renegotiateInstallment(id, newDate);

        return NextResponse.json(newInstallment);
    } catch (error) {
        console.error('Error renegotiating installment:', error);
        return NextResponse.json({ error: 'Failed to renegotiate installment' }, { status: 500 });
    }
}
