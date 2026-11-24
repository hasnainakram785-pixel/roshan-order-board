-- Import this in phpMyAdmin (Import tab) on the hosting account.
-- It does what `php artisan migrate --seed` does locally, because shared hosting has no SSH.
-- Same columns as database/migrations/2026_11_21_000000_create_orders_table.php

CREATE TABLE IF NOT EXISTS `orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `customer_name` varchar(255) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `orders_status_index` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `orders` (`customer_name`, `amount`, `status`, `created_at`, `updated_at`) VALUES
('Ayesha Khan', 50000.00,  'pending',      NOW(), NOW()),
('Bilal Ahmed', 120000.00, 'under_review', NOW(), NOW()),
('Fatima Noor', 75000.50,  'approved',     NOW(), NOW()),
('Usman Tariq', 200000.00, 'disbursed',    NOW(), NOW()),
('Sana Malik',  30000.00,  'rejected',     NOW(), NOW());
