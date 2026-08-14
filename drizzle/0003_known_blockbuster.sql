ALTER TABLE "social_accounts" ADD COLUMN "display_name" varchar(120);--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "profile_image_url" text;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;