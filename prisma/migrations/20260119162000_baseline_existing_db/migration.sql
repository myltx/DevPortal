-- CreateTable
CREATE TABLE `account` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `account` VARCHAR(191) NULL,
    `password` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,
    `module_id` INTEGER NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `area` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `create_time` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `area_name_key`(`name` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_log` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `action` VARCHAR(191) NOT NULL,
    `module` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `user_name` VARCHAR(191) NULL,
    `ip_address` VARCHAR(191) NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `class` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `label` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `noun_name_id` INTEGER NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `module` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `module_name` VARCHAR(191) NULL,
    `module_url` VARCHAR(191) NULL,
    `create_time` DATETIME(3) NULL,
    `update_time` DATETIME(3) NULL,
    `type_name` VARCHAR(191) NULL,
    `project_id` INTEGER NULL,
    `area_name` VARCHAR(191) NULL,
    `module_describe` TEXT NULL,
    `remark` TEXT NULL,
    `area_id` INTEGER NULL,

    INDEX `module_area_id_fkey`(`area_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `noun_name` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL,
    `alias_name` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `create_time` DATETIME(3) NULL,
    `update_time` DATETIME(3) NULL,
    `operate_user` VARCHAR(191) NULL,
    `class_id` INTEGER NULL,
    `english_name` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `obj_attr_define` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `obj_id` INTEGER NULL,
    `attr_name` VARCHAR(191) NULL,
    `attr_key` VARCHAR(191) NULL,
    `attr_type` VARCHAR(191) NULL,
    `required` BOOLEAN NULL,
    `remark` VARCHAR(191) NULL,
    `add_time` DATETIME(3) NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `object_info` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `obj_name` VARCHAR(191) NULL,
    `obj_key` VARCHAR(191) NULL,
    `remark` VARCHAR(191) NULL,
    `add_time` DATETIME(3) NULL,

    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_name` VARCHAR(191) NULL,
    `update_time` DATETIME(3) NULL,
    `sort` INTEGER NULL,
    `create_time` DATETIME(3) NULL,
    `project_describe` TEXT NULL,
    `area_name` VARCHAR(191) NULL,
    `class_id` INTEGER NULL,
    `area_id` INTEGER NULL,

    INDEX `project_area_id_fkey`(`area_id` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `system_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `config_key` VARCHAR(191) NOT NULL,
    `config_value` TEXT NULL,
    `description` VARCHAR(191) NULL,
    `update_time` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_config_config_key_key`(`config_key` ASC),
    PRIMARY KEY (`id` ASC)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `module` ADD CONSTRAINT `module_area_id_fkey` FOREIGN KEY (`area_id`) REFERENCES `area`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project` ADD CONSTRAINT `project_area_id_fkey` FOREIGN KEY (`area_id`) REFERENCES `area`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

