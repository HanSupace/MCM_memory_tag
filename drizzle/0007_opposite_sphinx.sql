CREATE TABLE "exhibition_entry_tokens" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"exhibition_id" bigint NOT NULL,
	"token_hash" char(64) NOT NULL,
	"token_type" varchar(20) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exhibition_entry_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "access_source" varchar(20) DEFAULT 'legacy' NOT NULL;--> statement-breakpoint
ALTER TABLE "exhibition_entry_tokens" ADD CONSTRAINT "exhibition_entry_tokens_exhibition_id_exhibitions_id_fk" FOREIGN KEY ("exhibition_id") REFERENCES "public"."exhibitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exhibition_entry_tokens_exhibition_id_idx" ON "exhibition_entry_tokens" USING btree ("exhibition_id");