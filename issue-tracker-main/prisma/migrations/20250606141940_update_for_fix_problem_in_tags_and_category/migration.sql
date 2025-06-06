-- AlterTable
ALTER TABLE `checklisttemplate` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX `Category_parentId_idx` ON `Category`(`parentId`);

-- CreateIndex
CREATE INDEX `ChecklistTemplate_isActive_idx` ON `ChecklistTemplate`(`isActive`);
