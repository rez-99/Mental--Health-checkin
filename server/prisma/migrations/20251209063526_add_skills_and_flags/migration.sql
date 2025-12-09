-- CreateEnum
CREATE TYPE "FlagType" AS ENUM ('SUSTAINED_LOW_MOOD_SLEEP', 'RAPID_DECLINE', 'HIGH_WORRIES', 'HIGH_BURDEN', 'CRISIS_INDICATOR');

-- CreateTable
CREATE TABLE "skill_paths" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "modules" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_paths_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skill_sessions" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "path_id" TEXT NOT NULL,
    "path_name" TEXT NOT NULL,
    "pre_mood" INTEGER,
    "post_mood" INTEGER,
    "completed_at" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skill_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flags" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "type" "FlagType" NOT NULL,
    "severity" TEXT NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "flags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_notification_preferences" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "low_mood_reminder" BOOLEAN NOT NULL DEFAULT true,
    "notify_trusted_adult" BOOLEAN NOT NULL DEFAULT false,
    "notify_counsellor" BOOLEAN NOT NULL DEFAULT false,
    "trusted_adult_email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_notification_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safety_plans" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "warning_signs" TEXT[],
    "coping_strategies" TEXT[],
    "reasons_to_stay_safe" TEXT[],
    "people_who_can_help" JSONB NOT NULL,
    "crisis_resources" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "safety_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "skill_sessions_student_id_idx" ON "skill_sessions"("student_id");

-- CreateIndex
CREATE INDEX "skill_sessions_completed_at_idx" ON "skill_sessions"("completed_at");

-- CreateIndex
CREATE INDEX "flags_student_id_idx" ON "flags"("student_id");

-- CreateIndex
CREATE INDEX "flags_type_idx" ON "flags"("type");

-- CreateIndex
CREATE INDEX "flags_createdAt_idx" ON "flags"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "flags_student_id_type_key" ON "flags"("student_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "student_notification_preferences_student_id_key" ON "student_notification_preferences"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "safety_plans_student_id_key" ON "safety_plans"("student_id");

-- AddForeignKey
ALTER TABLE "skill_sessions" ADD CONSTRAINT "skill_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "skill_sessions" ADD CONSTRAINT "skill_sessions_path_id_fkey" FOREIGN KEY ("path_id") REFERENCES "skill_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flags" ADD CONSTRAINT "flags_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_notification_preferences" ADD CONSTRAINT "student_notification_preferences_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safety_plans" ADD CONSTRAINT "safety_plans_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;
