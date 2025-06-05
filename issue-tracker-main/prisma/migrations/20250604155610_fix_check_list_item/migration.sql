/*
  Warnings:

  - Added the required column `order` to the `ChecklistItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `checklistitem` ADD COLUMN `order` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `ChecklistItem_templateId_order_idx` ON `ChecklistItem`(`templateId`, `order`);
