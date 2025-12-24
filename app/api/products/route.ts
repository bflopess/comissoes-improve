import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const products = await db.getProducts();
        return NextResponse.json(products);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching products' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const product = {
            id: uuidv4(),
            name: body.name,
            description: body.description,
            baseCommissionRate: parseFloat(body.baseCommissionRate),
            commissionType: body.commissionType,
            baseCost: body.baseCost ? parseFloat(body.baseCost) : undefined,
            active: true,
        };
        const newProduct = await db.addProduct(product);
        return NextResponse.json(newProduct);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error creating product' }, { status: 500 });
    }
}
