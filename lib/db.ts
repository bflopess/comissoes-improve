import { supabase, createClientServer } from './supabase';
import { v4 as uuidv4 } from 'uuid';
import { User, Product, Sale, Installment } from '@/types';

// Helper to map snake_case to camelCase
const mapUser = (u: any): User => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    active: u.active,
    avatarUrl: u.avatar_url,
    authId: u.auth_id,
});

const mapProduct = (p: any): Product => ({
    id: p.id,
    name: p.name,
    description: p.description,
    baseCommissionRate: parseFloat(p.base_commission_rate),
    commissionType: p.commission_type,
    baseCost: p.base_cost ? parseFloat(p.base_cost) : undefined,
    active: p.active,
});

const mapInstallment = (i: any): Installment => ({
    id: i.id,
    saleId: i.sale_id,
    installmentNumber: i.installment_number,
    totalInstallments: i.total_installments,
    dueDate: i.due_date,
    amount: parseFloat(i.amount),
    commissionAmount: parseFloat(i.commission_amount),
    clientPaid: i.client_paid,
    sellerPaid: i.seller_paid,
    paidDate: i.paid_date,
    status: i.status || 'Pending',
    originalInstallmentId: i.original_installment_id,
});

const mapSale = (s: any, installments: any[] = [], user?: any, product?: any): Sale => ({
    id: s.id,
    clientType: s.client_type,
    responsibleName: s.responsible_name,
    studentName: s.student_name,
    amount: parseFloat(s.amount),
    date: s.date,
    campaign: s.campaign,
    paymentMethod: s.payment_method,
    salespersonId: s.salesperson_id,
    productId: s.product_id,
    installmentStartDate: s.installment_start_date,
    dueDay: s.due_day,
    status: s.status,
    installments: installments.map(mapInstallment),
    salesperson: user ? mapUser(user) : undefined,
    product: product ? mapProduct(product) : undefined,
    salespersonName: user?.name,
    productName: product?.name,
});

class Database {
    // Users
    async getUsers() {
        const { data, error } = await supabase.from('users').select('*');
        if (error) throw error;
        return data.map(mapUser);
    }

    async getUser(id: string) {
        const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
        if (error) return null;
        return mapUser(data);
    }

    async getUserByAuthId(authId: string) {
        const { data, error } = await supabase.from('users').select('*').eq('auth_id', authId).single();
        if (error) return null;
        return mapUser(data);
    }

    async getCurrentUser() {
        const supabaseServer = await createClientServer();
        const { data: { user: authUser } } = await supabaseServer.auth.getUser();

        if (!authUser) return null;

        // 1. Try to find user by auth_id (using anon client for now, assuming permissions are OK)
        let dbUser = await this.getUserByAuthId(authUser.id);

        // 2. If not found, try to link by email
        if (!dbUser && authUser.email) {
            // Find by email directly to avoid exposing getUserByEmail publicly if not needed, 
            // or just use the private logic here.
            const { data: userByEmail } = await supabase.from('users').select('*').eq('email', authUser.email).single();

            if (userByEmail) {
                // Link it!
                console.log(`Linking user ${userByEmail.email} to auth_id ${authUser.id}`);
                const linked = await this.linkUserByEmail(authUser.email, authUser.id);
                if (linked) dbUser = linked;
            } else {
                // User has Auth but no DB record? 
                // We could create one here? 
                // For now, let's return null or maybe create a basic record?
                // The requirements say "User Management" creates the user. 
                // So if not in DB, they shouldn't log in? Or they see "Contact Admin"?
                // We'll return null for now.
            }
        }

        return dbUser;
    }

    async addUser(user: User) {
        const { data, error } = await supabase.from('users').insert({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            active: user.active,
            avatar_url: user.avatarUrl,
            auth_id: user.authId,
        }).select().single();
        if (error) throw error;
        return mapUser(data);
    }

    async updateUser(id: string, updates: Partial<User>) {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.email) dbUpdates.email = updates.email;
        if (updates.role) dbUpdates.role = updates.role;
        if (updates.active !== undefined) dbUpdates.active = updates.active;
        if (updates.avatarUrl) dbUpdates.avatar_url = updates.avatarUrl;

        const { data, error } = await supabase.from('users').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return mapUser(data);
    }

    async deleteUser(id: string) {
        const { error } = await supabase.from('users').delete().eq('id', id);
        return !error;
    }

    async linkUserByEmail(email: string, authId: string) {
        // Find user by email
        const { data: user, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (findError || !user) return null; // User not found

        // Update auth_id
        const { data, error } = await supabase
            .from('users')
            .update({ auth_id: authId })
            .eq('id', user.id)
            .select().single();

        if (error) throw error;
        return mapUser(data);
    }

    // Products
    async getProducts() {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        return data.map(mapProduct);
    }

    async getProduct(id: string) {
        const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
        if (error) return null;
        return mapProduct(data);
    }

    async addProduct(product: Product) {
        const { data, error } = await supabase.from('products').insert({
            id: product.id,
            name: product.name,
            description: product.description,
            base_commission_rate: product.baseCommissionRate,
            commission_type: product.commissionType,
            base_cost: product.baseCost,
            active: product.active,
        }).select().single();
        if (error) throw error;
        return mapProduct(data);
    }

    async updateProduct(id: string, updates: Partial<Product>) {
        const dbUpdates: any = {};
        if (updates.name) dbUpdates.name = updates.name;
        if (updates.description) dbUpdates.description = updates.description;
        if (updates.baseCommissionRate) dbUpdates.base_commission_rate = updates.baseCommissionRate;
        if (updates.commissionType) dbUpdates.commission_type = updates.commissionType;
        if (updates.baseCost !== undefined) dbUpdates.base_cost = updates.baseCost;
        if (updates.active !== undefined) dbUpdates.active = updates.active;

        const { data, error } = await supabase.from('products').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return mapProduct(data);
    }

    async deleteProduct(id: string) {
        const { error } = await supabase.from('products').delete().eq('id', id);
        return !error;
    }

    // Sales
    async getSales() {
        const { data: sales, error } = await supabase
            .from('sales')
            .select(`
        *,
        installments (*),
        users (*),
        products (*)
      `);

        if (error) throw error;

        return sales.map(s => mapSale(s, s.installments, s.users, s.products));
    }

    async getSale(id: string) {
        const { data: sale, error } = await supabase
            .from('sales')
            .select(`
        *,
        installments (*),
        users (*),
        products (*)
      `)
            .eq('id', id)
            .single();

        if (error) return null;
        return mapSale(sale, sale.installments, sale.users, sale.products);
    }

    async addSale(sale: Sale) {
        // Insert Sale
        const { data: saleData, error: saleError } = await supabase.from('sales').insert({
            id: sale.id,
            client_type: sale.clientType,
            responsible_name: sale.responsibleName,
            student_name: sale.studentName,
            amount: sale.amount,
            date: sale.date,
            campaign: sale.campaign,
            payment_method: sale.paymentMethod,
            salesperson_id: sale.salespersonId,
            product_id: sale.productId,
            installment_start_date: sale.installmentStartDate,
            due_day: sale.dueDay,
            status: sale.status,
        }).select().single();

        if (saleError) throw saleError;

        // Insert Installments
        const installmentsData = sale.installments.map(i => ({
            id: i.id,
            sale_id: sale.id,
            installment_number: i.installmentNumber,
            total_installments: i.totalInstallments,
            due_date: i.dueDate,
            amount: i.amount,
            commission_amount: i.commissionAmount,
            client_paid: i.clientPaid,
            seller_paid: i.sellerPaid,
            paid_date: i.paidDate,
            status: i.status,
            original_installment_id: i.originalInstallmentId,
        }));

        const { error: instError } = await supabase.from('installments').insert(installmentsData);
        if (instError) throw instError;

        return sale;
    }

    async updateSale(id: string, updates: Partial<Sale>) {
        const dbUpdates: any = {};
        if (updates.clientType) dbUpdates.client_type = updates.clientType;
        if (updates.responsibleName) dbUpdates.responsible_name = updates.responsibleName;
        if (updates.studentName) dbUpdates.student_name = updates.studentName;
        if (updates.amount) dbUpdates.amount = updates.amount;
        if (updates.date) dbUpdates.date = updates.date;
        if (updates.campaign) dbUpdates.campaign = updates.campaign;
        if (updates.paymentMethod) dbUpdates.payment_method = updates.paymentMethod;
        if (updates.salespersonId) dbUpdates.salesperson_id = updates.salespersonId;
        if (updates.productId) dbUpdates.product_id = updates.productId;

        const { data, error } = await supabase.from('sales').update(dbUpdates).eq('id', id).select().single();
        if (error) throw error;
        return mapSale(data);
    }

    async deleteSale(id: string) {
        // Supabase configured with cascade delete usually handles, but strict Foreign Keys might block.
        // We should delete installments first to be safe if cascade isn't set.
        await supabase.from('installments').delete().eq('sale_id', id);

        const { error } = await supabase.from('sales').delete().eq('id', id);
        return !error;
    }

    async updateInstallment(saleId: string, installmentId: string, updates: Partial<Installment>) {
        const dbUpdates: any = {};
        if (updates.clientPaid !== undefined) dbUpdates.client_paid = updates.clientPaid;
        if (updates.sellerPaid !== undefined) dbUpdates.seller_paid = updates.sellerPaid;
        if (updates.paidDate) dbUpdates.paid_date = updates.paidDate;
        if (updates.status) dbUpdates.status = updates.status;
        if (updates.originalInstallmentId) dbUpdates.original_installment_id = updates.originalInstallmentId;

        const { data, error } = await supabase.from('installments').update(dbUpdates).eq('id', installmentId).select().single();
        if (error) throw error;
        return mapInstallment(data);
    }

    async deleteInstallments(saleId: string) {
        const { error } = await supabase.from('installments').delete().eq('sale_id', saleId);
        if (error) throw error;
    }

    async createInstallments(installments: Installment[]) {
        const installmentsData = installments.map(i => ({
            id: i.id,
            sale_id: i.saleId,
            installment_number: i.installmentNumber,
            total_installments: i.totalInstallments,
            due_date: i.dueDate,
            amount: i.amount,
            commission_amount: i.commissionAmount,
            client_paid: i.clientPaid,
            seller_paid: i.sellerPaid,
            paid_date: i.paidDate,
            status: i.status || 'Pending',
            original_installment_id: i.originalInstallmentId,
        }));

        const { error } = await supabase.from('installments').insert(installmentsData);
        if (error) throw error;
    }

    async checkOverdueInstallments() {
        const today = new Date().toISOString().split('T')[0];

        // 1. Mark Pending as Overdue if past due AND NOT PAID
        const { error: overdueError } = await supabase
            .from('installments')
            .update({ status: 'Overdue' })
            .eq('status', 'Pending')
            .eq('client_paid', false) // Only if NOT paid
            .lt('due_date', today);

        if (overdueError) console.error("Error updating overdue installments:", overdueError);

        // 2. Fix Inconsistent Statuses: If it IS paid or renegotiated, it should NOT be Overdue.
        // This acts as a self-healing mechanism for existing data.
        // We set it back to 'Pending' (or we could have a 'Paid' status, but the requirement says "Customer Paid = Never Late", 
        // usually meaning status reflects workflow. If the system relies on 'Pending' + bool flags, we revert to Pending. 
        // Or if there is a 'Paid' status enum, we use that? The types show: status: 'Pending' | 'Overdue' | 'Renegotiated' | 'Completed'?
        // The type definition mapInstallment defaults to 'Pending'. 
        // Let's assume if paid, it shouldn't be 'Overdue'. Let's revert to 'Pending' so it just looks normal, 
        // OR better yet, if the system doesn't have a 'Paid' status string, 'Pending' with client_paid=true is the "Paid" state.

        const { error: fixError } = await supabase
            .from('installments')
            .update({ status: 'Pending' })
            .eq('status', 'Overdue')
            .or('client_paid.eq.true,status.eq.Renegotiated'); // If paid OR renegotiated, remove Overdue status

        // Note: The above .or syntax might need careful checking with Supabase JS. 
        // Simpler to do two calls if needed, but let's try strict "client_paid = true AND status = 'Overdue'"

        const { error: fixPaidError } = await supabase
            .from('installments')
            .update({ status: 'Pending' })
            .eq('status', 'Overdue')
            .eq('client_paid', true);

        if (fixPaidError) console.error("Error fixing paid overdue installments:", fixPaidError);
    }

    async renegotiateInstallment(oldInstallmentId: string, newDate: string) {
        // 1. Mark old as Renegotiated
        const { error: updateError } = await supabase
            .from('installments')
            .update({ status: 'Renegotiated' })
            .eq('id', oldInstallmentId);

        if (updateError) throw updateError;

        // 2. Fetch old installment to copy data
        const old = await this.getInstallment(oldInstallmentId);
        if (!old) throw new Error("Installment not found");

        const newId = uuidv4();

        // 3. Create new installment
        const newInstallment: Installment = {
            ...old,
            id: newId,
            dueDate: newDate,
            status: 'Pending',
            clientPaid: false,
            sellerPaid: false,
            paidDate: undefined,
            originalInstallmentId: oldInstallmentId,
        };

        await this.createInstallments([newInstallment]);

        return newInstallment;
    }

    // Helper to get single installment directly (not exposing full sale usually, but needed here)
    async getInstallment(id: string) {
        const { data, error } = await supabase.from('installments').select('*').eq('id', id).single();
        if (error || !data) return null;
        return mapInstallment(data);
    }
}

export const db = new Database();
