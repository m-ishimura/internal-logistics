-- Add missing composite and department-related indexes for shipments table performance
-- These indexes were missing from the previous migration and were applied manually

-- Composite index for department filtering with date range (most common query pattern)
CREATE INDEX IF NOT EXISTS "idx_shipments_dept_date_composite" ON "public"."shipments" ("shipment_department_id", "shipped_at" DESC, "created_at" DESC);

-- Index for destination department filtering
CREATE INDEX IF NOT EXISTS "idx_shipments_dest_dept" ON "public"."shipments" ("destination_department_id");

-- Composite index for management users filtering by both departments
CREATE INDEX IF NOT EXISTS "idx_shipments_both_depts" ON "public"."shipments" ("shipment_department_id", "destination_department_id");