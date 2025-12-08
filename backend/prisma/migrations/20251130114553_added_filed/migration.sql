/*
  Warnings:

  - The `paymentStatus` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `disputeStatus` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `status` on the `Dispute` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `status` on the `Task` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'ASSIGNED', 'PROCESSING', 'PAID', 'REVIEWED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'CONFIRMING', 'VERIFIED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "DisputeStatus" AS ENUM ('NONE', 'RAISED', 'VOTING', 'RESOLVED_REFUND', 'RESOLVED_RELEASE');

-- CreateEnum
CREATE TYPE "DisputeState" AS ENUM ('PENDING', 'VOTING', 'RESOLVED_REFUND', 'RESOLVED_RELEASE');

-- AlterTable
ALTER TABLE "Dispute" DROP COLUMN "status",
ADD COLUMN     "status" "DisputeState" NOT NULL;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "status",
ADD COLUMN     "status" "TaskStatus" NOT NULL,
DROP COLUMN "paymentStatus",
ADD COLUMN     "paymentStatus" "PaymentStatus",
DROP COLUMN "disputeStatus",
ADD COLUMN     "disputeStatus" "DisputeStatus";
