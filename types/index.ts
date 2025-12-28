export type Role = 'admin' | 'manager' | 'salesperson';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'salesperson' | 'manager';
  active: boolean;
  avatarUrl?: string | null;
  authId?: string;
}

export type CommissionType = 'percentage_on_sale' | 'percentage_on_profit';

export interface Product {
  id: string;
  name: string;
  description?: string;
  baseCommissionRate: number; // Percentage
  commissionType: CommissionType;
  baseCost?: number; // For profit calculation
  active: boolean;
}

export type InstallmentStatus = 'Pending' | 'Paid' | 'Overdue' | 'Renegotiated';

export interface Installment {
  id: string;
  saleId: string;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string; // ISO Date string
  amount: number;
  commissionAmount: number;
  status?: InstallmentStatus; // Optional for compatibility, but basically required now
  originalInstallmentId?: string;

  // Double Status
  clientPaid: boolean;
  sellerPaid: boolean;
  paidDate?: string; // When client paid
}

export type Campaign = 'Rematrícula 2026' | 'Black Week TOEPE' | 'Venda regular';
export type ClientType = 'adult' | 'responsible';

export interface Sale {
  id: string;
  date: string; // Sale Date
  amount: number;
  productId: string;
  productName?: string; // Denormalized (Legacy)
  product?: Product; // Relation
  salespersonId: string;
  salespersonName?: string; // Denormalized (Legacy)
  salesperson?: User; // Relation

  // Client Details
  clientType: string; // 'adult' | 'student'
  responsibleName: string;
  studentName?: string; // Optional if clientType is responsible

  // Campaign
  campaign: string;

  // Additional Fields
  paymentMethod?: string; // 'credit' | 'debit' | 'pix' | 'boleto' | 'cash' | 'check'

  // Installment Logic
  installmentStartDate: string;
  dueDay: number;

  installments: Installment[];
  status: 'Active' | 'Cancelled' | 'Completed';
}
