/*
  Warnings:

  - You are about to drop the column `department_id` on the `shipments` table. All the data in the column will be lost.
  - You are about to drop the column `destination` on the `shipments` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `uploaded_by` on the `bulk_imports` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `created_by` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `destination_department_id` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shipment_department_id` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_by` to the `shipments` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `sender_id` on the `shipments` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "public"."bulk_imports" DROP CONSTRAINT "bulk_imports_uploaded_by_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipments" DROP CONSTRAINT "shipments_department_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."shipments" DROP CONSTRAINT "shipments_sender_id_fkey";

-- AlterTable
ALTER TABLE "public"."bulk_imports" DROP COLUMN "uploaded_by",
ADD COLUMN     "uploaded_by" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."departments" ALTER COLUMN "code" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."items" ALTER COLUMN "unit" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."shipments" DROP COLUMN "department_id",
DROP COLUMN "destination",
ADD COLUMN     "created_by" INTEGER NOT NULL,
ADD COLUMN     "destination_department_id" INTEGER NOT NULL,
ADD COLUMN     "shipment_department_id" INTEGER NOT NULL,
ADD COLUMN     "updated_by" INTEGER NOT NULL,
DROP COLUMN "sender_id",
ADD COLUMN     "sender_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "public"."users" DROP CONSTRAINT "users_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_shipment_department_id_fkey" FOREIGN KEY ("shipment_department_id") REFERENCES "public"."departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_destination_department_id_fkey" FOREIGN KEY ("destination_department_id") REFERENCES "public"."departments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shipments" ADD CONSTRAINT "shipments_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."bulk_imports" ADD CONSTRAINT "bulk_imports_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
