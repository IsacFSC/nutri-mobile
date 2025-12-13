/*
  Warnings:

  - A unique constraint covering the columns `[cpf]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "address" TEXT,
ADD COLUMN     "alcoholConsumption" TEXT,
ADD COLUMN     "allergies" TEXT,
ADD COLUMN     "bloodType" TEXT,
ADD COLUMN     "bmi" DOUBLE PRECISION,
ADD COLUMN     "bodyFat" DOUBLE PRECISION,
ADD COLUMN     "chronicDiseases" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "emergencyContact" TEXT,
ADD COLUMN     "emergencyPhone" TEXT,
ADD COLUMN     "familyHistory" TEXT,
ADD COLUMN     "foodRestrictions" TEXT,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "hipCircumference" DOUBLE PRECISION,
ADD COLUMN     "lastConsultationDate" TIMESTAMP(3),
ADD COLUMN     "medications" TEXT,
ADD COLUMN     "muscleMass" DOUBLE PRECISION,
ADD COLUMN     "observations" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "physicalActivity" TEXT,
ADD COLUMN     "rg" TEXT,
ADD COLUMN     "sleepHours" DOUBLE PRECISION,
ADD COLUMN     "smokingStatus" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "stressLevel" TEXT,
ADD COLUMN     "waistCircumference" DOUBLE PRECISION,
ADD COLUMN     "zipCode" TEXT;

-- CreateTable
CREATE TABLE "consultation_notes" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "nutritionistId" TEXT NOT NULL,
    "currentWeight" DOUBLE PRECISION,
    "currentHeight" DOUBLE PRECISION,
    "currentBMI" DOUBLE PRECISION,
    "bloodPressure" TEXT,
    "heartRate" INTEGER,
    "bodyComposition" JSONB,
    "complaints" TEXT,
    "symptoms" TEXT,
    "dietaryRecall" TEXT,
    "physicalActivity" TEXT,
    "diagnosis" TEXT,
    "nutritionalPlan" TEXT,
    "recommendations" TEXT,
    "goals" TEXT,
    "restrictions" TEXT,
    "dietPrescription" TEXT,
    "supplementation" TEXT,
    "nextAppointment" TIMESTAMP(3),
    "followUpNotes" TEXT,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consultation_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_cpf_key" ON "patients"("cpf");

-- AddForeignKey
ALTER TABLE "consultation_notes" ADD CONSTRAINT "consultation_notes_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
