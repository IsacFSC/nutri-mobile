/*
  Warnings:

  - A unique constraint covering the columns `[protocolNumber]` on the table `patients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "consultation_notes" ADD COLUMN     "foodsToAvoid" TEXT,
ADD COLUMN     "lifestyleChanges" TEXT,
ADD COLUMN     "recommendedExercises" TEXT,
ADD COLUMN     "recommendedFoods" TEXT,
ADD COLUMN     "sleepRecommendations" TEXT,
ADD COLUMN     "supplements" TEXT,
ADD COLUMN     "waterIntake" TEXT;

-- AlterTable
ALTER TABLE "patients" ADD COLUMN     "protocolNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "patients_protocolNumber_key" ON "patients"("protocolNumber");
