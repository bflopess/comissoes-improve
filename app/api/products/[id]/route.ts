import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = await db.getProduct(id);

    if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const body = await request.json();
        const updatedProduct = await db.updateProduct(id, {
            name: body.name,
            description: body.description,
            baseCommissionRate: parseFloat(body.baseCommissionRate),
            commissionType: body.commissionType,
            baseCost: body.baseCost ? parseFloat(body.baseCost) : undefined,
            active: body.active !== undefined ? body.active : true,
        });

        if (!updatedProduct) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(updatedProduct);
    } catch (error) {
        return NextResponse.json({ error: 'Error updating product' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // Soft delete: just set active to false
    const updatedProduct = await db.updateProduct(id, { active: false });

    if (!updatedProduct) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Produto desativado com sucesso (Soft Delete)' });
}
