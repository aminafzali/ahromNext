/*
  Warnings:

  - Made the column `workspaceId` on table `checklisttemplate` required. This step will fail if there are existing NULL values in that column.
  - Made the column `workspaceId` on table `issue` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE `checklisttemplate` DROP FOREIGN KEY `ChecklistTemplate_workspaceId_fkey`;

-- DropForeignKey
ALTER TABLE `issue` DROP FOREIGN KEY `Issue_workspaceId_fkey`;

-- AlterTable
ALTER TABLE `checklisttemplate` MODIFY `workspaceId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `issue` MODIFY `workspaceId` INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE `ChecklistTemplate` ADD CONSTRAINT `ChecklistTemplate_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Issue` ADD CONSTRAINT `Issue_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
