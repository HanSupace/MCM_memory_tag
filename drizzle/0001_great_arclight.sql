CREATE TABLE "artists" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(120) NOT NULL,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artworks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"title" varchar(160) NOT NULL,
	"artist_id" bigint,
	"production_year" varchar(20),
	"material" varchar(160),
	"image_url" text,
	"base_description" text,
	"appreciation_points" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collections" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"exhibition_artwork_id" bigint NOT NULL,
	"collected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consents" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"type" varchar(30) NOT NULL,
	"granted" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_unlocks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"exhibition_id" bigint NOT NULL,
	"content_type" varchar(40) NOT NULL,
	"unlock_at" timestamp with time zone NOT NULL,
	"viewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "docent_sources" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"artwork_id" bigint NOT NULL,
	"source_type" varchar(40) NOT NULL,
	"source_info" text,
	"body" text NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"review_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exhibition_artists" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"exhibition_id" bigint NOT NULL,
	"artist_id" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exhibition_artworks" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"exhibition_id" bigint NOT NULL,
	"artwork_id" bigint NOT NULL,
	"collect_identifier" varchar(120) NOT NULL,
	"exhibition_description" text,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exhibitions" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" text,
	"hero_image_url" text,
	"venue" varchar(160) NOT NULL,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"operating_hours" varchar(160),
	"status" varchar(20) DEFAULT 'upcoming' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_photos" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"exhibition_id" bigint NOT NULL,
	"file_ref" text NOT NULL,
	"analysis_consent" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "keyrings" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"keyring_code" varchar(64) NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "keyrings_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "keyrings_keyring_code_unique" UNIQUE("keyring_code")
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"exhibition_artwork_id" bigint NOT NULL,
	"content" varchar(200) NOT NULL,
	"visibility" varchar(20) DEFAULT 'private' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_recommendations" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"product_ref" varchar(120) NOT NULL,
	"reason" text,
	"impressed_at" timestamp with time zone,
	"clicked_at" timestamp with time zone,
	"saved_at" timestamp with time zone,
	"dismissed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taste_profiles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"items" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "taste_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" bigint NOT NULL,
	"exhibition_id" bigint NOT NULL,
	"visited_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_users" ADD COLUMN "role" varchar(20) DEFAULT 'visitor' NOT NULL;--> statement-breakpoint
ALTER TABLE "artworks" ADD CONSTRAINT "artworks_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collections" ADD CONSTRAINT "collections_exhibition_artwork_id_exhibition_artworks_id_fk" FOREIGN KEY ("exhibition_artwork_id") REFERENCES "public"."exhibition_artworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consents" ADD CONSTRAINT "consents_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_unlocks" ADD CONSTRAINT "content_unlocks_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_unlocks" ADD CONSTRAINT "content_unlocks_exhibition_id_exhibitions_id_fk" FOREIGN KEY ("exhibition_id") REFERENCES "public"."exhibitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "docent_sources" ADD CONSTRAINT "docent_sources_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exhibition_artists" ADD CONSTRAINT "exhibition_artists_exhibition_id_exhibitions_id_fk" FOREIGN KEY ("exhibition_id") REFERENCES "public"."exhibitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exhibition_artists" ADD CONSTRAINT "exhibition_artists_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exhibition_artworks" ADD CONSTRAINT "exhibition_artworks_exhibition_id_exhibitions_id_fk" FOREIGN KEY ("exhibition_id") REFERENCES "public"."exhibitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exhibition_artworks" ADD CONSTRAINT "exhibition_artworks_artwork_id_artworks_id_fk" FOREIGN KEY ("artwork_id") REFERENCES "public"."artworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exhibitions" ADD CONSTRAINT "exhibitions_created_by_app_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_photos" ADD CONSTRAINT "gallery_photos_exhibition_id_exhibitions_id_fk" FOREIGN KEY ("exhibition_id") REFERENCES "public"."exhibitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "keyrings" ADD CONSTRAINT "keyrings_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notes" ADD CONSTRAINT "notes_exhibition_artwork_id_exhibition_artworks_id_fk" FOREIGN KEY ("exhibition_artwork_id") REFERENCES "public"."exhibition_artworks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_recommendations" ADD CONSTRAINT "product_recommendations_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taste_profiles" ADD CONSTRAINT "taste_profiles_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_exhibition_id_exhibitions_id_fk" FOREIGN KEY ("exhibition_id") REFERENCES "public"."exhibitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collections_user_artwork_unique" ON "collections" USING btree ("user_id","exhibition_artwork_id");--> statement-breakpoint
CREATE UNIQUE INDEX "consents_user_type_unique" ON "consents" USING btree ("user_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "content_unlocks_user_exhibition_type_unique" ON "content_unlocks" USING btree ("user_id","exhibition_id","content_type");--> statement-breakpoint
CREATE INDEX "docent_sources_artwork_id_idx" ON "docent_sources" USING btree ("artwork_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exhibition_artists_unique" ON "exhibition_artists" USING btree ("exhibition_id","artist_id");--> statement-breakpoint
CREATE UNIQUE INDEX "exhibition_artworks_identifier_unique" ON "exhibition_artworks" USING btree ("exhibition_id","collect_identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "exhibition_artworks_exhibition_artwork_unique" ON "exhibition_artworks" USING btree ("exhibition_id","artwork_id");--> statement-breakpoint
CREATE INDEX "gallery_photos_user_exhibition_idx" ON "gallery_photos" USING btree ("user_id","exhibition_id");--> statement-breakpoint
CREATE UNIQUE INDEX "notes_user_artwork_unique" ON "notes" USING btree ("user_id","exhibition_artwork_id");--> statement-breakpoint
CREATE INDEX "product_recommendations_user_id_idx" ON "product_recommendations" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "visits_user_exhibition_unique" ON "visits" USING btree ("user_id","exhibition_id");--> statement-breakpoint
CREATE INDEX "visits_exhibition_id_idx" ON "visits" USING btree ("exhibition_id");