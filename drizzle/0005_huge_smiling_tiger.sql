CREATE TYPE "public"."notification_channel" AS ENUM('EMAIL', 'SMS', 'PUSH', 'WHATSAPP');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('PENDING', 'SENT', 'FAILED');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY NOT NULL,
	"recipient_id" text NOT NULL,
	"message" text NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"status" "notification_status" NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
