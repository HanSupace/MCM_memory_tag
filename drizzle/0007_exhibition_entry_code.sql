ALTER TABLE "exhibitions" ADD COLUMN "entry_code" varchar(64);--> statement-breakpoint
ALTER TABLE "exhibitions" ADD CONSTRAINT "exhibitions_entry_code_unique" UNIQUE("entry_code");