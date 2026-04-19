CREATE TABLE `activity_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int NOT NULL,
	`action` varchar(64) NOT NULL,
	`entityType` varchar(64),
	`entityId` int,
	`details` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `calendar_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`startTime` timestamp NOT NULL,
	`endTime` timestamp,
	`allDay` boolean NOT NULL DEFAULT false,
	`taskId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `calendar_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`folderId` int,
	`name` varchar(500) NOT NULL,
	`url` text NOT NULL,
	`fileKey` text NOT NULL,
	`mimeType` varchar(128),
	`size` int,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `folders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`parentId` int,
	`name` varchar(255) NOT NULL,
	`color` varchar(32),
	`archived` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `folders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `memory_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text,
	`tags` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `memory_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`parentId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mindmap_edges` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`sourceId` int NOT NULL,
	`targetId` int NOT NULL,
	`label` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mindmap_edges_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `mindmap_nodes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`label` varchar(500),
	`content` text,
	`nodeType` enum('text','image','link','document') NOT NULL DEFAULT 'text',
	`posX` int NOT NULL DEFAULT 0,
	`posY` int NOT NULL DEFAULT 0,
	`width` int NOT NULL DEFAULT 200,
	`height` int NOT NULL DEFAULT 100,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `mindmap_nodes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notebooks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notebooks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`messageId` int NOT NULL,
	`userId` int NOT NULL,
	`emoji` varchar(32) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `reactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `room_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`userId` int NOT NULL,
	`memberRole` enum('owner','collaborator','viewer') NOT NULL DEFAULT 'collaborator',
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `room_members_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `rooms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signatures` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`imageUrl` text NOT NULL,
	`imageKey` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signatures_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `signed_documents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`fileId` int,
	`signatureId` int NOT NULL,
	`userId` int NOT NULL,
	`signedUrl` text,
	`signedKey` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `signed_documents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` int AUTO_INCREMENT NOT NULL,
	`roomId` int NOT NULL,
	`title` varchar(500) NOT NULL,
	`description` text,
	`status` enum('todo','in_progress','done') NOT NULL DEFAULT 'todo',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`assigneeId` int,
	`dueDate` timestamp,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tasks_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `avatarUrl` text;--> statement-breakpoint
ALTER TABLE `users` ADD `bio` text;--> statement-breakpoint
ALTER TABLE `users` ADD `timezone` varchar(64);