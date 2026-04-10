CREATE TABLE `nota_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`nome` varchar(100) NOT NULL,
	`descricao` text,
	`cor` varchar(20) NOT NULL DEFAULT '#6b7280',
	`ativo` boolean NOT NULL DEFAULT true,
	`ordem` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nota_status_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nota_tipo` (
	`id` int AUTO_INCREMENT NOT NULL,
	`codigo` varchar(20) NOT NULL,
	`nome` varchar(100) NOT NULL,
	`descricao` text,
	`ativo` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `nota_tipo_id` PRIMARY KEY(`id`),
	CONSTRAINT `nota_tipo_codigo_unique` UNIQUE(`codigo`)
);
--> statement-breakpoint
CREATE TABLE `notas` (
	`id` int AUTO_INCREMENT NOT NULL,
	`chaveAcesso` varchar(60),
	`numero` varchar(20) NOT NULL,
	`serie` varchar(10) NOT NULL DEFAULT '1',
	`tipoId` int NOT NULL,
	`statusId` int NOT NULL,
	`emitenteCnpj` varchar(18) NOT NULL,
	`emitenteNome` varchar(200) NOT NULL,
	`emitenteUf` varchar(2),
	`destinatarioCnpjCpf` varchar(18),
	`destinatarioNome` varchar(200),
	`valorTotal` decimal(15,2) NOT NULL,
	`valorDesconto` decimal(15,2) DEFAULT '0',
	`valorImpostos` decimal(15,2) DEFAULT '0',
	`dataEmissao` timestamp NOT NULL,
	`dataEntradaSaida` timestamp,
	`origem` enum('xml','manual') NOT NULL DEFAULT 'manual',
	`xmlUrl` text,
	`xmlNomeArquivo` varchar(255),
	`dadosExtras` json,
	`observacoes` text,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notas_id` PRIMARY KEY(`id`),
	CONSTRAINT `notas_chaveAcesso_unique` UNIQUE(`chaveAcesso`),
	CONSTRAINT `unique_nota` UNIQUE(`numero`,`serie`,`emitenteCnpj`,`tipoId`)
);
--> statement-breakpoint
CREATE TABLE `user_permissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`canViewNotas` boolean NOT NULL DEFAULT true,
	`canCreateNota` boolean NOT NULL DEFAULT false,
	`canEditNota` boolean NOT NULL DEFAULT false,
	`canDeleteNota` boolean NOT NULL DEFAULT false,
	`canImportXml` boolean NOT NULL DEFAULT false,
	`canManageStatus` boolean NOT NULL DEFAULT false,
	`canManageTipos` boolean NOT NULL DEFAULT false,
	`canManageUsers` boolean NOT NULL DEFAULT false,
	`canViewDashboard` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_permissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `notas` ADD CONSTRAINT `notas_tipoId_nota_tipo_id_fk` FOREIGN KEY (`tipoId`) REFERENCES `nota_tipo`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notas` ADD CONSTRAINT `notas_statusId_nota_status_id_fk` FOREIGN KEY (`statusId`) REFERENCES `nota_status`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `notas` ADD CONSTRAINT `notas_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `user_permissions` ADD CONSTRAINT `user_permissions_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;