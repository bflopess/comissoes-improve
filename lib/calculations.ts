import { Sale, Product, Installment } from '@/types';

export const calculateCommission = (amount: number, product: Product, baseCost: number = 0): number => {
    if (product.commissionType === 'percentage_on_profit') {
        const profit = amount - baseCost;
        return profit > 0 ? (profit * product.baseCommissionRate) / 100 : 0;
    }
    return (amount * product.baseCommissionRate) / 100;
};

export const calculateInstallmentCommission = (
    totalCommission: number,
    totalInstallments: number,
    installmentNumber: number
): number => {
    // Simple equal distribution for now
    return Number((totalCommission / totalInstallments).toFixed(2));
};

export const recalculateSaleCommissions = (sale: Sale, product: Product): Sale => {
    const totalCommission = calculateCommission(sale.amount, product, product.baseCost);

    const updatedInstallments = sale.installments.map(inst => ({
        ...inst,
        commissionAmount: calculateInstallmentCommission(totalCommission, sale.installments.length, inst.installmentNumber)
    }));

    return {
        ...sale,
        installments: updatedInstallments
    };
};

export const getCommissionSummary = (sales: Sale[]) => {
    const allInstallments = sales.flatMap(s => s.installments);

    const total = allInstallments.reduce((acc, inst) => acc + inst.commissionAmount, 0);
    const paid = allInstallments.filter(inst => inst.sellerPaid).reduce((acc, inst) => acc + inst.commissionAmount, 0);
    const pending = allInstallments.filter(inst => !inst.sellerPaid).reduce((acc, inst) => acc + inst.commissionAmount, 0);

    return { total, paid, pending };
};
