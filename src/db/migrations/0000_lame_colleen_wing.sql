CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`client_code` varchar(50) NOT NULL,
	`client_name` varchar(255) NOT NULL,
	`bank_account_no` varchar(50) NOT NULL,
	`bank_name` varchar(50) NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`),
	CONSTRAINT `clients_client_code_unique` UNIQUE(`client_code`),
	CONSTRAINT `clients_bank_account_no_unique` UNIQUE(`bank_account_no`)
);
--> statement-breakpoint
CREATE TABLE `receipt_sequences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bank` enum('BCA','MUFG','HSBC') NOT NULL,
	`date` date NOT NULL,
	`current_sequence` int NOT NULL DEFAULT 0,
	CONSTRAINT `receipt_sequences_id` PRIMARY KEY(`id`),
	CONSTRAINT `bank_date_unique` UNIQUE(`bank`,`date`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(21) NOT NULL,
	`expires_at` datetime NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transaction_headers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`bank` enum('BCA','MUFG','HSBC') NOT NULL,
	`upload_date` datetime NOT NULL,
	`total_transactions` int NOT NULL DEFAULT 0,
	`mapped_count` int NOT NULL DEFAULT 0,
	`unmapped_count` int NOT NULL DEFAULT 0,
	`status` enum('Draft','Receipt Generated') NOT NULL DEFAULT 'Draft',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `transaction_headers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`header_id` int NOT NULL,
	`transaction_no` varchar(100) NOT NULL,
	`transaction_date` date NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`sender_account_no` varchar(50) NOT NULL,
	`sender_name` varchar(255) NOT NULL,
	`client_id` int,
	`receipt_no` varchar(50),
	`status` enum('Unmapped','Mapped','Receipt Generated') NOT NULL DEFAULT 'Unmapped',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `transactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `transactions_receipt_no_unique` UNIQUE(`receipt_no`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(21) NOT NULL,
	`username` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_username_unique` UNIQUE(`username`)
);
--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_header_id_transaction_headers_id_fk` FOREIGN KEY (`header_id`) REFERENCES `transaction_headers`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_client_id_clients_id_fk` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE no action ON UPDATE no action;