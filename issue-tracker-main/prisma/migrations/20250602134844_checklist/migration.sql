/*
  Warnings:

  - You are about to drop the column `status` on the `checklisttemplate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `checklisttemplate` DROP COLUMN `status`;

-- CreateTable
CREATE TABLE `ChecklistItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `templateId` INTEGER NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,

    INDEX `ChecklistItem_templateId_idx`(`templateId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistAssignment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `templateId` INTEGER NOT NULL,
    `assignedToUserId` VARCHAR(255) NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChecklistAssignment_templateId_idx`(`templateId`),
    INDEX `ChecklistAssignment_assignedToUserId_idx`(`assignedToUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistResponse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `assignmentId` INTEGER NOT NULL,
    `itemId` INTEGER NOT NULL,
    `status` ENUM('NONE', 'ACCEPTABLE', 'UNACCEPTABLE') NOT NULL DEFAULT 'NONE',
    `respondedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChecklistResponse_assignmentId_idx`(`assignmentId`),
    INDEX `ChecklistResponse_itemId_idx`(`itemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_ResponseIssues` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_ResponseIssues_AB_unique`(`A`, `B`),
    INDEX `_ResponseIssues_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
