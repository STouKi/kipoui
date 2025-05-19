CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"username" varchar,
	"full_name" varchar,
	"avatar_url" varchar
);
