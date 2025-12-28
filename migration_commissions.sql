-- Add original_installment_id to installments table
ALTER TABLE installments 
ADD COLUMN original_installment_id UUID REFERENCES installments(id);

-- Depending on how 'status' is being used:
-- If it's just a text column (as per schema.prisma earlier), we don't need to do anything.
-- But if we want to update existing 'Pending' statuses that are overdue, we can do it here too:
-- UPDATE installments SET status = 'Overdue' WHERE status = 'Pending' AND due_date < NOW();

-- Recommendation: Run this first part. The status update logic will be handled by the application code repeatedly.
