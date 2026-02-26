ALTER TABLE `apifox_spec_snapshot`
  DROP INDEX `uk_apifox_spec_snapshot_key`;

ALTER TABLE `apifox_spec_snapshot`
  DROP INDEX `idx_apifox_spec_snapshot_project`;

ALTER TABLE `apifox_spec_snapshot`
  DROP COLUMN `module_key`,
  DROP COLUMN `api_prefix`;

ALTER TABLE `apifox_spec_snapshot`
  ADD UNIQUE INDEX `uk_apifox_spec_snapshot_project_id`(`project_id`),
  ADD INDEX `idx_apifox_spec_snapshot_project`(`project_id`, `created_at`);
