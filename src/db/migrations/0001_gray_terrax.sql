CREATE TABLE `receipt_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`transaction_id` int NOT NULL,
	`pdf_blob` longblob NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `receipt_files_id` PRIMARY KEY(`id`),
	CONSTRAINT `receipt_files_transaction_id_unique` UNIQUE(`transaction_id`)
);
--> statement-breakpoint
ALTER TABLE `receipt_files` ADD CONSTRAINT `receipt_files_transaction_id_transactions_id_fk` FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON DELETE no action ON UPDATE no action;