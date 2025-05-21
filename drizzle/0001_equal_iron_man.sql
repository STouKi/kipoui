CREATE TYPE "public"."allergy" AS ENUM('celery', 'cereals_containing_gluten', 'crustaceans', 'eggs', 'fish', 'lupin', 'milk', 'molluscs', 'mustard', 'peanuts', 'sesame_seeds', 'soybeans', 'sulphur_dioxide_and_sulphites', 'tree_nuts');--> statement-breakpoint
CREATE TYPE "public"."diet" AS ENUM('vegan', 'vegetarian', 'pescatarian');--> statement-breakpoint
CREATE TYPE "public"."eating_disorders" AS ENUM('anorexia', 'bulimia');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female');--> statement-breakpoint
CREATE TYPE "public"."medical_regimen" AS ENUM('diabetes', 'cholesterol', 'hypertension', 'crohn');--> statement-breakpoint
CREATE TYPE "public"."religious_regime" AS ENUM('halal', 'kasher', 'buddhist', 'religious_fasting');--> statement-breakpoint
CREATE TABLE "goals" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "goals_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"target_weight" integer,
	"deadline" timestamp,
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "habits" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "habits_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"sport_week_frequency" integer,
	"compulsive_habits" boolean,
	"diet" "diet",
	"religious_regime" "religious_regime",
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "medical_data" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "medical_data_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"medical_regimen" "medical_regimen",
	"allergies" "allergy"[],
	"eating_disorders" "eating_disorders"[],
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "physical_data" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "physical_data_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"gender" "gender",
	"birth_date" timestamp,
	"height_cm" integer,
	"weight_kg" integer,
	"profile_id" uuid
);
--> statement-breakpoint
CREATE TABLE "preferences" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "preferences_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"dislikes" varchar[],
	"profile_id" uuid
);
--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habits" ADD CONSTRAINT "habits_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "medical_data" ADD CONSTRAINT "medical_data_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "physical_data" ADD CONSTRAINT "physical_data_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;