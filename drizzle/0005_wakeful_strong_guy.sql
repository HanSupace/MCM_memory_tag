ALTER TABLE "gallery_photos" ADD COLUMN "image_data" "bytea";--> statement-breakpoint
ALTER TABLE "gallery_photos" ADD COLUMN "mime_type" varchar(100);