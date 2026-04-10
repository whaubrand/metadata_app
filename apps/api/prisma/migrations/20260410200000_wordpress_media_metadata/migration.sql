-- Delete existing test/dev data so we can safely change columns
DELETE FROM "metadata_results";

-- Drop old social media metadata columns
ALTER TABLE "metadata_results" DROP COLUMN "seo_title";
ALTER TABLE "metadata_results" DROP COLUMN "meta_description";
ALTER TABLE "metadata_results" DROP COLUMN "social_caption";
ALTER TABLE "metadata_results" DROP COLUMN "recommended_channel";
ALTER TABLE "metadata_results" DROP COLUMN "channel_explanation";

-- Add new WordPress media library metadata columns
ALTER TABLE "metadata_results" ADD COLUMN "suggested_filename" TEXT NOT NULL DEFAULT '';
ALTER TABLE "metadata_results" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "metadata_results" ADD COLUMN "caption" TEXT NOT NULL DEFAULT '';
ALTER TABLE "metadata_results" ADD COLUMN "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "metadata_results" ADD COLUMN "seo_keywords" TEXT NOT NULL DEFAULT '';
ALTER TABLE "metadata_results" ADD COLUMN "clarifying_questions" TEXT NOT NULL DEFAULT '';

-- Remove temporary defaults (new rows must always supply values)
ALTER TABLE "metadata_results" ALTER COLUMN "suggested_filename" DROP DEFAULT;
ALTER TABLE "metadata_results" ALTER COLUMN "title" DROP DEFAULT;
ALTER TABLE "metadata_results" ALTER COLUMN "caption" DROP DEFAULT;
ALTER TABLE "metadata_results" ALTER COLUMN "description" DROP DEFAULT;
ALTER TABLE "metadata_results" ALTER COLUMN "seo_keywords" DROP DEFAULT;
ALTER TABLE "metadata_results" ALTER COLUMN "clarifying_questions" DROP DEFAULT;
