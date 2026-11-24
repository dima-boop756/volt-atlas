CREATE TYPE "public"."connector_type" AS ENUM('CCS2', 'Type 2', 'GB/T', 'CHAdeMO');--> statement-breakpoint
CREATE TYPE "public"."station_district" AS ENUM('Алатауский', 'Алмалинский', 'Ауэзовский', 'Бостандыкский', 'Жетысуский', 'Медеуский', 'Наурызбайский', 'Турксибский');--> statement-breakpoint
CREATE TYPE "public"."station_status" AS ENUM('active', 'maintenance', 'offline');--> statement-breakpoint
CREATE TABLE "connectors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"station_id" uuid NOT NULL,
	"type" "connector_type" NOT NULL,
	"power_kw" double precision NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "connectors_positive_power" CHECK ("connectors"."power_kw" > 0),
	CONSTRAINT "connectors_positive_quantity" CHECK ("connectors"."quantity" > 0)
);
--> statement-breakpoint
CREATE TABLE "operators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"contact" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operator_id" uuid NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"district" "station_district" NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"price_kwh" double precision NOT NULL,
	"opening_hours" text NOT NULL,
	"status" "station_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stations_latitude_range" CHECK ("stations"."latitude" between -90 and 90),
	CONSTRAINT "stations_longitude_range" CHECK ("stations"."longitude" between -180 and 180),
	CONSTRAINT "stations_price_nonnegative" CHECK ("stations"."price_kwh" >= 0)
);
--> statement-breakpoint
ALTER TABLE "connectors" ADD CONSTRAINT "connectors_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stations" ADD CONSTRAINT "stations_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "connectors_station_idx" ON "connectors" USING btree ("station_id");--> statement-breakpoint
CREATE INDEX "stations_operator_idx" ON "stations" USING btree ("operator_id");