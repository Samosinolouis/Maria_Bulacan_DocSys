CREATE SCHEMA IF NOT EXISTS "app";
--> statement-breakpoint
CREATE TYPE "app"."activity_log_action" AS ENUM('EVENT_CREATED', 'EVENT_UPDATED', 'EVENT_CANCELLED');--> statement-breakpoint
CREATE TYPE "app"."document_attachment_kind" AS ENUM('DRAFT', 'SIGNED_FINAL', 'TRANSMISSION_PROOF');--> statement-breakpoint
CREATE TYPE "app"."document_log_action" AS ENUM('RECEIVED', 'SCREENED_PASS', 'SCREENED_FAIL', 'RETURNED_FOR_COMPLIANCE', 'RESUBMITTED', 'ASSIGNED', 'DRAFTED', 'SUBMITTED_REVIEW', 'APPROVED', 'ENDORSED', 'DENIED', 'SIGNED', 'TRANSMITTED', 'CLOSED', 'REOPENED');--> statement-breakpoint
CREATE TYPE "app"."document_status" AS ENUM('DRAFTING', 'UNDER_REVIEW', 'APPROVED', 'ENDORSED', 'DENIED', 'SIGNED');--> statement-breakpoint
CREATE TYPE "app"."event_status" AS ENUM('CONFIRMED', 'TENTATIVE', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "app"."notification_type" AS ENUM('EVENT_REMINDER', 'EVENT_UPDATED', 'EVENT_CANCELLED', 'SUBMITTED_FOR_REVIEW', 'DECISION_RECORDED', 'SLA_AT_RISK', 'SLA_OVERDUE');--> statement-breakpoint
CREATE TYPE "app"."request_attachment_kind" AS ENUM('INCOMING_LETTER', 'ANNEX');--> statement-breakpoint
CREATE TYPE "app"."request_channel" AS ENUM('WALK_IN', 'MAIL', 'COURIER', 'EMAIL');--> statement-breakpoint
CREATE TYPE "app"."request_priority" AS ENUM('NORMAL', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "app"."request_status" AS ENUM('RECEIVED', 'SCREENING', 'RETURNED_FOR_COMPLIANCE', 'PREPARATION', 'REVIEW', 'APPROVED', 'ENDORSED', 'DENIED', 'TRANSMITTED', 'CLOSED');--> statement-breakpoint
CREATE TYPE "app"."transmission_method" AS ENUM('PICKUP', 'COURIER', 'EMAIL');--> statement-breakpoint
CREATE TABLE "app"."activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"actor_name" varchar(255) NOT NULL,
	"actor_role" varchar(100) NOT NULL,
	"action_type" "app"."activity_log_action" NOT NULL,
	"template" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."control_number_sequences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seq_code" varchar(100) NOT NULL,
	"year" integer NOT NULL,
	"last_value" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "control_number_sequences_seq_code_year_unique" UNIQUE("seq_code","year")
);
--> statement-breakpoint
CREATE TABLE "app"."document_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"kind" "app"."document_attachment_kind" NOT NULL,
	"storage_key" varchar(1024) NOT NULL,
	"bucket_name" varchar(255) NOT NULL,
	"original_name" varchar(1024) NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"size_bytes" integer NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."document_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid,
	"document_id" uuid,
	"actor_id" uuid NOT NULL,
	"actor_name" varchar(255) NOT NULL,
	"actor_role" varchar(100) NOT NULL,
	"action_type" "app"."document_log_action" NOT NULL,
	"template" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."document_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"prefix" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "document_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "app"."documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid,
	"control_no" varchar(50) NOT NULL,
	"document_type_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"status" "app"."document_status" DEFAULT 'DRAFTING' NOT NULL,
	"assigned_to" uuid,
	"signatory_required" boolean DEFAULT false NOT NULL,
	"signed_by" uuid,
	"signed_at" timestamp with time zone,
	"denial_reason" text,
	"decision_notes" text,
	"decided_by" uuid,
	"decided_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "documents_control_no_unique" UNIQUE("control_no")
);
--> statement-breakpoint
CREATE TABLE "app"."event_attendees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "event_attendees_event_id_user_id_unique" UNIQUE("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "app"."events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"organizer_id" uuid,
	"department" varchar(255) NOT NULL,
	"event_date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"status" "app"."event_status" DEFAULT 'CONFIRMED' NOT NULL,
	"involves_mayor" boolean DEFAULT false NOT NULL,
	"involves_administrator" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."holidays" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"holiday_date" date NOT NULL,
	"name" varchar(255) NOT NULL,
	CONSTRAINT "holidays_holiday_date_unique" UNIQUE("holiday_date")
);
--> statement-breakpoint
CREATE TABLE "app"."notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "app"."notification_type" NOT NULL,
	"title" varchar(500) NOT NULL,
	"payload" jsonb NOT NULL,
	"template" text NOT NULL,
	"request_id" uuid,
	"document_id" uuid,
	"event_id" uuid,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."request_attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"kind" "app"."request_attachment_kind" NOT NULL,
	"storage_key" varchar(1024) NOT NULL,
	"bucket_name" varchar(255) NOT NULL,
	"original_name" varchar(1024) NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"size_bytes" integer NOT NULL,
	"checksum" varchar(64) NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."request_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"prefix" varchar(10) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "request_types_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "app"."requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"control_no" varchar(50) NOT NULL,
	"request_type_id" uuid NOT NULL,
	"title" varchar(500) NOT NULL,
	"requesting_party" varchar(255) NOT NULL,
	"origin_office" varchar(255) NOT NULL,
	"channel" "app"."request_channel" NOT NULL,
	"priority" "app"."request_priority" DEFAULT 'NORMAL' NOT NULL,
	"received_at" timestamp with time zone NOT NULL,
	"sla_deadline" timestamp with time zone NOT NULL,
	"status" "app"."request_status" DEFAULT 'RECEIVED' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "requests_control_no_unique" UNIQUE("control_no")
);
--> statement-breakpoint
CREATE TABLE "app"."roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"permission_payload" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "app"."transmissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"recipient_name" varchar(255) NOT NULL,
	"receiving_office" varchar(255) NOT NULL,
	"received_by" varchar(255) NOT NULL,
	"method" "app"."transmission_method" NOT NULL,
	"transmitted_at" timestamp with time zone NOT NULL,
	"notes" text,
	"proof_attachment_id" uuid,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "app"."user_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_unique" UNIQUE("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "app"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"middle_name" varchar(255),
	"last_name" varchar(255) NOT NULL,
	"suffix" varchar(50),
	"email" varchar(320) NOT NULL,
	"contact_no" varchar(50) NOT NULL,
	"office" varchar(255) NOT NULL,
	"position" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "app"."venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"special_use" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "venues_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "app"."activity_logs" ADD CONSTRAINT "activity_logs_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "app"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."activity_logs" ADD CONSTRAINT "activity_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_attachments" ADD CONSTRAINT "document_attachments_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "app"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_attachments" ADD CONSTRAINT "document_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_logs" ADD CONSTRAINT "document_logs_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "app"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_logs" ADD CONSTRAINT "document_logs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "app"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."document_logs" ADD CONSTRAINT "document_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."documents" ADD CONSTRAINT "documents_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "app"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."documents" ADD CONSTRAINT "documents_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "app"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."documents" ADD CONSTRAINT "documents_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."documents" ADD CONSTRAINT "documents_signed_by_users_id_fk" FOREIGN KEY ("signed_by") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."documents" ADD CONSTRAINT "documents_decided_by_users_id_fk" FOREIGN KEY ("decided_by") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."documents" ADD CONSTRAINT "documents_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."event_attendees" ADD CONSTRAINT "event_attendees_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "app"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."event_attendees" ADD CONSTRAINT "event_attendees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."events" ADD CONSTRAINT "events_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "app"."venues"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."events" ADD CONSTRAINT "events_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."notifications" ADD CONSTRAINT "notifications_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "app"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."notifications" ADD CONSTRAINT "notifications_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "app"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."notifications" ADD CONSTRAINT "notifications_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "app"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."request_attachments" ADD CONSTRAINT "request_attachments_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "app"."requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."request_attachments" ADD CONSTRAINT "request_attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."requests" ADD CONSTRAINT "requests_request_type_id_request_types_id_fk" FOREIGN KEY ("request_type_id") REFERENCES "app"."request_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."requests" ADD CONSTRAINT "requests_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."transmissions" ADD CONSTRAINT "transmissions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "app"."documents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."transmissions" ADD CONSTRAINT "transmissions_proof_attachment_id_document_attachments_id_fk" FOREIGN KEY ("proof_attachment_id") REFERENCES "app"."document_attachments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."transmissions" ADD CONSTRAINT "transmissions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "app"."roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."user_roles" ADD CONSTRAINT "user_roles_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_logs_event_id_index" ON "app"."activity_logs" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "document_attachments_document_id_index" ON "app"."document_attachments" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_logs_request_id_index" ON "app"."document_logs" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "document_logs_document_id_index" ON "app"."document_logs" USING btree ("document_id");--> statement-breakpoint
CREATE INDEX "document_logs_actor_id_index" ON "app"."document_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "documents_request_id_index" ON "app"."documents" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "documents_status_index" ON "app"."documents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "documents_document_type_id_index" ON "app"."documents" USING btree ("document_type_id");--> statement-breakpoint
CREATE INDEX "event_attendees_user_id_index" ON "app"."event_attendees" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_venue_id_event_date_index" ON "app"."events" USING btree ("venue_id","event_date");--> statement-breakpoint
CREATE INDEX "events_event_date_index" ON "app"."events" USING btree ("event_date");--> statement-breakpoint
CREATE INDEX "notifications_user_id_created_at_index" ON "app"."notifications" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "request_attachments_request_id_index" ON "app"."request_attachments" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "requests_status_index" ON "app"."requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "requests_sla_deadline_index" ON "app"."requests" USING btree ("sla_deadline");--> statement-breakpoint
CREATE INDEX "transmissions_document_id_index" ON "app"."transmissions" USING btree ("document_id");