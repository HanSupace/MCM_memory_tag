CREATE TABLE "docent_conversations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"exhibition_artwork_id" bigint NOT NULL,
	"role" varchar(20) NOT NULL,
	"content" text NOT NULL,
	"share_personalization" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "docent_conversations" ADD CONSTRAINT "docent_conversations_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "docent_conversations" ADD CONSTRAINT "docent_conversations_exhibition_artwork_id_exhibition_artworks_id_fk" FOREIGN KEY ("exhibition_artwork_id") REFERENCES "public"."exhibition_artworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "docent_conversations_user_artwork_idx" ON "docent_conversations" USING btree ("user_id","exhibition_artwork_id");