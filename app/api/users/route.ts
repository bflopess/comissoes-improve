import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
    try {
        const users = await db.getUsers();
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const user = {
            id: uuidv4(),
            name: body.name,
            email: body.email,
            role: body.role,
            avatarUrl: body.avatarUrl,
            active: true,
        };
        const newUser = await db.addUser(user);
        return NextResponse.json(newUser);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Error creating user' }, { status: 500 });
    }
}
