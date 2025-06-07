/*
  Warnings:

  - You are about to drop the `_checklisttemplatecategories` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_checklisttemplatetags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE `_checklisttemplatecategories`;

-- DropTable
DROP TABLE `_checklisttemplatetags`;

-- CreateTable
CREATE TABLE `CategoryOnChecklistTemplates` (
    `checklistTemplateId` INTEGER NOT NULL,
    `categoryId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`checklistTemplateId`, `categoryId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TagOnChecklistTemplates` (
    `checklistTemplateId` INTEGER NOT NULL,
    `tagId` INTEGER NOT NULL,
    `assignedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`checklistTemplateId`, `tagId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
