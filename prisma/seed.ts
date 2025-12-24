import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Users
    const admin = await prisma.user.upsert({
        where: { email: 'admin@improve.com' },
        update: {},
        create: {
            email: 'admin@improve.com',
            name: 'Administrador',
            password: 'admin', // In real app, hash this
            role: 'admin',
            avatarUrl: 'https://i.pravatar.cc/150?u=admin',
            active: true,
        },
    })

    const manager = await prisma.user.upsert({
        where: { email: 'gerente@improve.com' },
        update: {},
        create: {
            email: 'gerente@improve.com',
            name: 'Gerente Comercial',
            password: '123',
            role: 'manager',
            avatarUrl: 'https://i.pravatar.cc/150?u=manager',
            active: true,
        },
    })

    const seller1 = await prisma.user.upsert({
        where: { email: 'joao@improve.com' },
        update: {},
        create: {
            email: 'joao@improve.com',
            name: 'João Silva',
            password: '123',
            role: 'salesperson',
            avatarUrl: 'https://i.pravatar.cc/150?u=joao',
            active: true,
        },
    })

    const seller2 = await prisma.user.upsert({
        where: { email: 'maria@improve.com' },
        update: {},
        create: {
            email: 'maria@improve.com',
            name: 'Maria Souza',
            password: '123',
            role: 'salesperson',
            avatarUrl: 'https://i.pravatar.cc/150?u=maria',
            active: true,
        },
    })

    // Products
    const course = await prisma.product.create({
        data: {
            name: 'Curso de Inglês - Semestral',
            description: 'Curso completo de inglês (6 meses)',
            baseCommissionRate: 10,
            commissionType: 'percentage_on_sale',
            active: true,
        },
    })

    const material = await prisma.product.create({
        data: {
            name: 'Material Didático',
            description: 'Kit de livros e acesso online',
            baseCommissionRate: 15,
            commissionType: 'percentage_on_profit',
            baseCost: 150.00,
            active: true,
        },
    })

    const toefl = await prisma.product.create({
        data: {
            name: 'Preparatório TOEFL',
            description: 'Curso intensivo para certificação',
            baseCommissionRate: 12,
            commissionType: 'percentage_on_sale',
            active: true,
        },
    })

    console.log({ admin, manager, seller1, seller2, course, material, toefl })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
