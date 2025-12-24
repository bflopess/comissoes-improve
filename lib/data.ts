import { User, Product, Sale, Installment } from '@/types';

export const users: User[] = [
    {
        id: 'u1',
        name: 'Alice Admin',
        email: 'alice@improve.com',
        role: 'admin',
        avatarUrl: 'https://i.pravatar.cc/150?u=alice',
        active: true,
    },
    {
        id: 'u2',
        name: 'Bob Sales',
        email: 'bob@improve.com',
        role: 'salesperson',
        avatarUrl: 'https://i.pravatar.cc/150?u=bob',
        active: true,
    },
    {
        id: 'u3',
        name: 'Charlie Manager',
        email: 'charlie@improve.com',
        role: 'manager',
        avatarUrl: 'https://i.pravatar.cc/150?u=charlie',
        active: true,
    },
];

export const products: Product[] = [
    {
        id: 'p1',
        name: 'Consulting Package A',
        baseCommissionRate: 10,
        description: 'Standard consulting package',
        commissionType: 'percentage_on_sale',
        active: true,
    },
    {
        id: 'p2',
        name: 'Software License',
        baseCommissionRate: 5,
        description: 'Annual software license',
        commissionType: 'percentage_on_sale',
        active: true,
    },
    {
        id: 'p3',
        name: 'Enterprise Solution',
        baseCommissionRate: 15,
        description: 'Full enterprise implementation',
        commissionType: 'percentage_on_profit',
        baseCost: 5000,
        active: true,
    },
];

// Helper to generate installments
const generateInstallments = (saleId: string, totalAmount: number, count: number, startDate: string, commissionRate: number): Installment[] => {
    const installments: Installment[] = [];
    const amountPerInstallment = totalAmount / count;
    const commissionPerInstallment = (amountPerInstallment * commissionRate) / 100;
    const start = new Date(startDate);

    for (let i = 1; i <= count; i++) {
        const dueDate = new Date(start);
        dueDate.setMonth(start.getMonth() + i - 1); // Start paying from start date? Or next month? User said "Parcelas podem começar em outro"

        installments.push({
            id: `${saleId}-i${i}`,
            saleId: saleId,
            installmentNumber: i,
            totalInstallments: count,
            dueDate: dueDate.toISOString().split('T')[0],
            amount: Number(amountPerInstallment.toFixed(2)),
            commissionAmount: Number(commissionPerInstallment.toFixed(2)),
            clientPaid: i === 1, // Mock: first one paid
            sellerPaid: false,
            paidDate: i === 1 ? startDate : undefined,
        });
    }
    return installments;
};

export const sales: Sale[] = [
    {
        id: 's1',
        date: '2025-11-15',
        amount: 5000,
        productId: 'p1',
        productName: 'Consulting Package A',
        salespersonId: 'u2',
        salespersonName: 'Bob Sales',
        clientType: 'adult',
        responsibleName: 'Acme Corp',
        campaign: 'Venda regular',
        installmentStartDate: '2025-11-15',
        dueDay: 15,
        status: 'Active',
        installments: generateInstallments('s1', 5000, 5, '2025-11-15', 10),
    },
    {
        id: 's2',
        date: '2025-12-01',
        amount: 12000,
        productId: 'p3',
        productName: 'Enterprise Solution',
        salespersonId: 'u2',
        salespersonName: 'Bob Sales',
        clientType: 'responsible',
        responsibleName: 'John Doe',
        studentName: 'Little Johnny',
        campaign: 'Black Week TOEPE',
        installmentStartDate: '2026-01-10',
        dueDay: 10,
        status: 'Active',
        installments: generateInstallments('s2', 12000, 12, '2026-01-10', 15),
    },
];
