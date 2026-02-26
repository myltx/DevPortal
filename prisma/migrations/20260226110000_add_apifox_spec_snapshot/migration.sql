CREATE TABLE `apifox_spec_snapshot` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `project_id` VARCHAR(191) NOT NULL,
  `module_key` VARCHAR(191) NOT NULL DEFAULT '',
  `target_url` VARCHAR(191) NOT NULL,
  `api_prefix` VARCHAR(191) NOT NULL DEFAULT '',
  `spec_hash` VARCHAR(191) NOT NULL,
  `spec_json` LONGTEXT NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `uk_apifox_spec_snapshot_key`(`project_id`, `module_key`, `target_url`, `api_prefix`),
  INDEX `idx_apifox_spec_snapshot_project`(`project_id`, `module_key`, `created_at`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
