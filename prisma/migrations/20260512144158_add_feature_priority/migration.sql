/*
  Warnings:

  - You are about to drop the column `oauthExpiresAt` on the `ai_provider_configs` table. All the data in the column will be lost.
  - You are about to drop the column `oauthRefresh` on the `ai_provider_configs` table. All the data in the column will be lost.
  - You are about to drop the column `oauthToken` on the `ai_provider_configs` table. All the data in the column will be lost.
  - You are about to drop the `api_tokens` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `cloud_projects` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `conflict_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `driver_configs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `oauth_accounts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_link_codes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `project_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `remote_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `spec_versions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sync_events` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `sync_manifests` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `synced_specs` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "api_tokens" DROP CONSTRAINT "api_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "cloud_projects" DROP CONSTRAINT "cloud_projects_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "conflict_records" DROP CONSTRAINT "conflict_records_resolved_by_fkey";

-- DropForeignKey
ALTER TABLE "conflict_records" DROP CONSTRAINT "conflict_records_spec_id_fkey";

-- DropForeignKey
ALTER TABLE "project_link_codes" DROP CONSTRAINT "project_link_codes_cloud_project_id_fkey";

-- DropForeignKey
ALTER TABLE "project_members" DROP CONSTRAINT "project_members_cloud_project_id_fkey";

-- DropForeignKey
ALTER TABLE "project_members" DROP CONSTRAINT "project_members_user_id_fkey";

-- DropForeignKey
ALTER TABLE "remote_sessions" DROP CONSTRAINT "remote_sessions_config_id_fkey";

-- DropForeignKey
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "spec_versions" DROP CONSTRAINT "spec_versions_modified_by_fkey";

-- DropForeignKey
ALTER TABLE "spec_versions" DROP CONSTRAINT "spec_versions_spec_id_fkey";

-- DropForeignKey
ALTER TABLE "sync_events" DROP CONSTRAINT "sync_events_cloud_project_id_fkey";

-- DropForeignKey
ALTER TABLE "sync_events" DROP CONSTRAINT "sync_events_user_id_fkey";

-- DropForeignKey
ALTER TABLE "sync_manifests" DROP CONSTRAINT "sync_manifests_session_id_fkey";

-- DropForeignKey
ALTER TABLE "synced_specs" DROP CONSTRAINT "synced_specs_cloud_project_id_fkey";

-- AlterTable
ALTER TABLE "ai_provider_configs" DROP COLUMN "oauthExpiresAt",
DROP COLUMN "oauthRefresh",
DROP COLUMN "oauthToken";

-- AlterTable
ALTER TABLE "features" ADD COLUMN     "priority" TEXT,
ADD COLUMN     "priority_reason" TEXT;

-- AlterTable
ALTER TABLE "mind_map_nodes" ADD COLUMN     "priority" TEXT;

-- DropTable
DROP TABLE "api_tokens";

-- DropTable
DROP TABLE "cloud_projects";

-- DropTable
DROP TABLE "conflict_records";

-- DropTable
DROP TABLE "driver_configs";

-- DropTable
DROP TABLE "oauth_accounts";

-- DropTable
DROP TABLE "project_link_codes";

-- DropTable
DROP TABLE "project_members";

-- DropTable
DROP TABLE "remote_sessions";

-- DropTable
DROP TABLE "sessions";

-- DropTable
DROP TABLE "spec_versions";

-- DropTable
DROP TABLE "sync_events";

-- DropTable
DROP TABLE "sync_manifests";

-- DropTable
DROP TABLE "synced_specs";

-- DropTable
DROP TABLE "users";

-- CreateIndex
CREATE INDEX "features_project_id_order_idx" ON "features"("project_id", "order");

-- CreateIndex
CREATE INDEX "tasks_feature_id_order_idx" ON "tasks"("feature_id", "order");

-- CreateIndex
CREATE INDEX "user_stories_feature_id_order_idx" ON "user_stories"("feature_id", "order");
