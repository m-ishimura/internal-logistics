-- Add performance indexes for shipments table queries used in dashboard

-- Index for shipped_at DESC queries (for shipped items)
CREATE INDEX "idx_shipments_shipped_at_desc" ON "public"."shipments" ("shipped_at" DESC) WHERE "shipped_at" IS NOT NULL;

-- Index for created_at DESC queries (for unshipped items)  
CREATE INDEX "idx_shipments_created_at_desc" ON "public"."shipments" ("created_at" DESC) WHERE "shipped_at" IS NULL;

-- Composite index for department filtering with date range (most common query pattern)
CREATE INDEX "idx_shipments_dept_date_composite" ON "public"."shipments" ("shipment_department_id", "shipped_at" DESC, "created_at" DESC);

-- Index for destination department filtering
CREATE INDEX "idx_shipments_dest_dept" ON "public"."shipments" ("destination_department_id");

-- Composite index for management users filtering by both departments
CREATE INDEX "idx_shipments_both_depts" ON "public"."shipments" ("shipment_department_id", "destination_department_id");