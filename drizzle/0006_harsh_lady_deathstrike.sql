ALTER TABLE "content_unlocks" ADD COLUMN "generated_content" jsonb;--> statement-breakpoint
ALTER TABLE "content_unlocks" ADD COLUMN "generated_at" timestamp with time zone;