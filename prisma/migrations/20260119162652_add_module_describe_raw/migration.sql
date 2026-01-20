-- Add temporary backup column for module_describe normalization
ALTER TABLE `module`
  ADD COLUMN `module_describe_raw` TEXT NULL AFTER `module_describe`;

