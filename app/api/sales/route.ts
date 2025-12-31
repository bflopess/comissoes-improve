import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        await db.checkOverdueInstallments();
        const sales = await db.getSales();
        return NextResponse.json(sales);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching sales' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const product = await db.getProduct(body.productId);

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        // Calculate total commission
        let totalCommission = 0;
        if (product.commissionType === 'percentage_on_profit') {
            const profit = parseFloat(body.amount) - (product.baseCost || 0);
            totalCommission = profit > 0 ? (profit * product.baseCommissionRate) / 100 : 0;
        } else {
            totalCommission = (parseFloat(body.amount) * product.baseCommissionRate) / 100;
        }

        const saleId = uuidv4();
        const totalInstallments = parseInt(body.installments);
        const totalAmount = parseFloat(body.amount);

        // Calculate base installment (floor to 2 decimals)
        const baseInstallmentAmount = Math.floor((totalAmount / totalInstallments) * 100) / 100;
        // Calculate the difference to be added to the last installment
        const totalBaseAmount = baseInstallmentAmount * totalInstallments;
        const remainderAmount = Math.round((totalAmount - totalBaseAmount) * 100) / 100;

        // Same logic for commission
        const baseCommissionAmount = Math.floor((totalCommission / totalInstallments) * 100) / 100;
        const totalBaseCommission = baseCommissionAmount * totalInstallments;
        const remainderCommission = Math.round((totalCommission - totalBaseCommission) * 100) / 100;

        const installments = Array.from({ length: totalInstallments }).map((_, index) => {
            const installmentNumber = index + 1;
            const isLast = index === totalInstallments - 1;

            const dueDate = new Date(body.installmentStartDate);
            dueDate.setMonth(dueDate.getMonth() + index);

            // Add remainder to the last installment
            const amount = isLast ? (baseInstallmentAmount + remainderAmount) : baseInstallmentAmount;
            const commissionAmount = isLast ? (baseCommissionAmount + remainderCommission) : baseCommissionAmount;

            // Ensure we handle floating point weirdness with toFixed if needed, 
            // but keeping as number for DB. The math above with *100/100 helps.
            // Let's verify: 1474 / 6 -> 245.66. 245.66 * 6 = 1473.96. Remainder = 0.04.
            // Last = 245.66 + 0.04 = 245.70. Correct.

            return {
                id: uuidv4(),
                saleId,
                installmentNumber,
                totalInstallments,
                dueDate: dueDate.toISOString(),
                amount: parseFloat(amount.toFixed(2)),
                commissionAmount: parseFloat(commissionAmount.toFixed(2)),
                status: 'Pending' as const,
                clientPaid: false,
                sellerPaid: false,
            };
        });

        const sale = {
            id: saleId,
            clientType: body.clientType,
            responsibleName: body.responsibleName,
            studentName: body.studentName,
            amount: parseFloat(body.amount),
            date: body.date,
            campaign: body.campaign,
            salespersonId: body.salespersonId,
            productId: body.productId,
            installmentStartDate: body.installmentStartDate,
            dueDay: parseInt(body.dueDay),
            installments,
            paymentMethod: body.paymentMethod, // Add payment method
            status: 'Completed' as 'Completed',
        };

        const newSale = await db.addSale(sale);

        return NextResponse.json(newSale);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error creating sale' }, { status: 500 });
    }
}
