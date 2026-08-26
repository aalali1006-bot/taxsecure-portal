CREATE TABLE `clientProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firmId` int NOT NULL,
	`userId` int NOT NULL,
	`displayName` varchar(160) NOT NULL,
	`clientReference` varchar(64) NOT NULL,
	`dataMode` enum('demo','production') NOT NULL DEFAULT 'demo',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `clientProfiles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `documentAuditEvents` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firmId` int NOT NULL,
	`documentId` int,
	`actorUserId` int,
	`actorRole` varchar(32) NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`metadataSummary` text NOT NULL,
	`previousHash` varchar(64) NOT NULL,
	`eventHash` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `documentAuditEvents_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `firmMemberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firmId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('firm_admin','caseworker') NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `firmMemberships_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `firms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`tenantKey` varchar(64) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `firms_id` PRIMARY KEY(`id`),
	CONSTRAINT `firms_tenantKey_unique` UNIQUE(`tenantKey`)
);
--> statement-breakpoint
CREATE TABLE `taxDocuments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firmId` int NOT NULL,
	`clientProfileId` int NOT NULL,
	`externalReference` varchar(64) NOT NULL,
	`originalFilename` varchar(160) NOT NULL,
	`mimeType` varchar(120) NOT NULL,
	`sizeBytes` int NOT NULL,
	`storageKey` varchar(512) NOT NULL,
	`storageUrl` varchar(640) NOT NULL,
	`status` enum('submitted','under_review','query','completed') NOT NULL DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `taxDocuments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `teamsHandoffs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firmId` int NOT NULL,
	`documentId` int NOT NULL,
	`eventType` varchar(80) NOT NULL,
	`portalReference` varchar(240) NOT NULL,
	`payloadHash` varchar(64) NOT NULL,
	`attachmentCount` int NOT NULL DEFAULT 0,
	`deliveryMode` enum('simulated','graph') NOT NULL DEFAULT 'simulated',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teamsHandoffs_id` PRIMARY KEY(`id`)
);
