-- AlterTable
ALTER TABLE `checklisttemplate` ADD COLUMN `createdByUserId` VARCHAR(255) NULL;

-- CreateIndex
CREATE INDEX `CategoryOnChecklistTemplates_checklistTemplateId_idx` ON `CategoryOnChecklistTemplates`(`checklistTemplateId`);

-- CreateIndex
CREATE INDEX `CategoryOnChecklistTemplates_categoryId_idx` ON `CategoryOnChecklistTemplates`(`categoryId`);

-- CreateIndex
CREATE INDEX `ChecklistTemplate_createdByUserId_idx` ON `ChecklistTemplate`(`createdByUserId`);

-- CreateIndex
CREATE INDEX `TagOnChecklistTemplates_checklistTemplateId_idx` ON `TagOnChecklistTemplates`(`checklistTemplateId`);

-- CreateIndex
CREATE INDEX `TagOnChecklistTemplates_tagId_idx` ON `TagOnChecklistTemplates`(`tagId`);
