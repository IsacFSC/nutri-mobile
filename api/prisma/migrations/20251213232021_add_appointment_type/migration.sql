-- CreateEnum
CREATE TYPE "AppointmentType" AS ENUM ('ONLINE', 'PRESENCIAL', 'RETORNO');

-- AlterTable
ALTER TABLE "appointments" ADD COLUMN     "type" "AppointmentType" NOT NULL DEFAULT 'ONLINE';
