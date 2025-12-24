import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sale = await db.getSale(id);

    if (!sale) {
        return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json(sale);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await request.json();

        // 1. Fetch current sale to compare
        const currentSale = await db.getSale(id);
        if (!currentSale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
        }

        // 2. Check if we need to regenerate installments
        // We regenerate if installments count changes OR if amount changes (because amount per installment changes)
        // OR if product commission logic implies a change (but simplistically, amount/installments are key)
        // User said: "Ao alterar... apagar e recriar".
        // Use loose comparison for numeric strings
        const newInstallmentsCount = parseInt(body.installments);
        const currentInstallmentsCount = currentSale.installments.length;
        const newAmount = parseFloat(body.amount);
        const currentAmount = currentSale.amount;

        const needsRegeneration = (newInstallmentsCount !== currentInstallmentsCount) || (Math.abs(newAmount - currentAmount) > 0.01);

        if (needsRegeneration) {
            // 3. Delete old installments
            await db.deleteInstallments(id);

            // 4. Calculate new values
            // We need product info for commission
            const product = await db.getProduct(body.productId);
            if (!product) throw new Error('Product not found for commission calc');

            let totalCommission = 0;
            if (product.commissionType === 'percentage_on_profit') {
                const profit = newAmount - (product.baseCost || 0);
                totalCommission = profit > 0 ? (profit * product.baseCommissionRate) / 100 : 0;
            } else {
                totalCommission = (newAmount * product.baseCommissionRate) / 100;
            }

            // 5. Create new installments
            const { v4: uuidv4 } = require('uuid');
            const newInstallments = Array.from({ length: newInstallmentsCount }).map((_, index) => {
                const installmentNumber = index + 1;
                const dueDate = new Date(body.installmentStartDate);
                dueDate.setMonth(dueDate.getMonth() + index);

                return {
                    id: uuidv4(),
                    saleId: id,
                    installmentNumber,
                    totalInstallments: newInstallmentsCount,
                    dueDate: dueDate.toISOString(),
                    amount: newAmount / newInstallmentsCount,
                    commissionAmount: totalCommission / newInstallmentsCount,
                    clientPaid: false,
                    sellerPaid: false,
                };
            });

            // @ts-ignore
            await db.createInstallments(newInstallments);
        }

        const updatedSale = await db.updateSale(id, {
            clientType: body.clientType,
            responsibleName: body.responsibleName,
            studentName: body.studentName,
            amount: parseFloat(body.amount),
            date: body.date,
            campaign: body.campaign,
            salespersonId: body.salespersonId,
            productId: body.productId,
            paymentMethod: body.paymentMethod,
        });

        if (!updatedSale) {
            return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
        }

        return NextResponse.json(updatedSale);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error updating sale' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const success = await db.deleteSale(id);

    if (!success) {
        return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
