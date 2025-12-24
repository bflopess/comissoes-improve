import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
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
        const installments = Array.from({ length: totalInstallments }).map((_, index) => {
            const installmentNumber = index + 1;

            const dueDate = new Date(body.installmentStartDate);
            dueDate.setMonth(dueDate.getMonth() + index);

            const amount = parseFloat(body.amount) / totalInstallments;
            const commissionAmount = totalCommission / totalInstallments;

            return {
                id: uuidv4(),
                saleId,
                installmentNumber,
                totalInstallments,
                dueDate: dueDate.toISOString(),
                amount,
                commissionAmount,
                status: 'Pending',
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
