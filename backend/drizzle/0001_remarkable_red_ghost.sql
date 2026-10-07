CREATE TABLE "app"."folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"path" varchar(1024) NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "folders_path_unique" UNIQUE("path"),
	CONSTRAINT "folders_parent_name_unique" UNIQUE("parent_id","name")
);
--> statement-breakpoint
ALTER TABLE "app"."documents" ADD COLUMN "folder_id" uuid;--> statement-breakpoint
ALTER TABLE "app"."folders" ADD CONSTRAINT "folders_parent_id_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "app"."folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app"."folders" ADD CONSTRAINT "folders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "app"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "folders_parent_id_index" ON "app"."folders" USING btree ("parent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "folders_root_name_unique" ON "app"."folders" USING btree ("name") WHERE "app"."folders"."parent_id" is null;--> statement-breakpoint
ALTER TABLE "app"."documents" ADD CONSTRAINT "documents_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "app"."folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_folder_id_index" ON "app"."documents" USING btree ("folder_id");