import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { id, clientPaid, sellerPaid } = body;

        // We need to find the sale that has this installment
        // In Supabase, we can update the installment directly by ID
        // But we need the saleId to return the updated object if we want to follow the previous pattern
        // However, the previous pattern was inefficient. 
        // Let's just update the installment directly.

        // Note: db.updateInstallment now takes saleId and installmentId but in Supabase we only need installmentId
        // But our db adapter signature is updateInstallment(saleId, installmentId, updates)
        // We can pass null for saleId if we update the adapter or just pass a dummy value since we'll change the adapter to use installmentId primarily

        // Actually, let's look at the adapter:
        // async updateInstallment(saleId: string, installmentId: string, updates: Partial<Installment>)
        // It uses .eq('id', installmentId), so saleId is ignored.

        const updatedInstallment = await db.updateInstallment('ignored', id, {
            clientPaid,
            sellerPaid,
            paidDate: sellerPaid ? new Date().toISOString() : undefined
        });

        return NextResponse.json(updatedInstallment);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error updating installment' }, { status: 500 });
    }
}
