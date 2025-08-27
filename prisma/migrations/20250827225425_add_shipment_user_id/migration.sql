-- AlterTable
ALTER TABLE "public"."shipments" ADD COLUMN     "shipment_user_id" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_shipment_user_id_fkey" FOREIGN KEY ("shipment_user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
