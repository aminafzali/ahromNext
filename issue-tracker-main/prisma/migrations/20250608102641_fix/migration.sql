/*
  Warnings:

  - You are about to drop the column `assignedToUserId` on the `checklistassignment` table. All the data in the column will be lost.
  - You are about to drop the column `assignedToUserId` on the `issue` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `ChecklistAssignment_assignedToUserId_idx` ON `checklistassignment`;

-- DropIndex
DROP INDEX `Issue_assignedToUserId_idx` ON `issue`;

-- AlterTable
ALTER TABLE `checklistassignment` DROP COLUMN `assignedToUserId`;

-- AlterTable
ALTER TABLE `checklisttemplate` ADD COLUMN `workspaceId` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `issue` DROP COLUMN `assignedToUserId`,
    ADD COLUMN `createdByUserId` VARCHAR(255) NULL,
    ADD COLUMN `workspaceId` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `Workspace` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Team` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `workspaceId` INTEGER NOT NULL,

    INDEX `Team_workspaceId_idx`(`workspaceId`),
    UNIQUE INDEX `Team_workspaceId_name_key`(`workspaceId`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WorkspaceMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER', 'GUEST', 'VIEWER') NOT NULL DEFAULT 'MEMBER',
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `workspaceId` INTEGER NOT NULL,
    `userId` VARCHAR(255) NOT NULL,

    INDEX `WorkspaceMember_userId_idx`(`userId`),
    INDEX `WorkspaceMember_workspaceId_idx`(`workspaceId`),
    UNIQUE INDEX `WorkspaceMember_workspaceId_userId_key`(`workspaceId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TeamMember` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `joinedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `teamId` INTEGER NOT NULL,
    `userId` VARCHAR(255) NOT NULL,

    INDEX `TeamMember_userId_idx`(`userId`),
    INDEX `TeamMember_teamId_idx`(`teamId`),
    UNIQUE INDEX `TeamMember_teamId_userId_key`(`teamId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Permission` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `level` ENUM('VIEW', 'EDIT', 'MANAGE') NOT NULL,
    `workspaceMemberId` INTEGER NULL,
    `teamId` INTEGER NULL,
    `checklistTemplateId` INTEGER NULL,
    `projectId` INTEGER NULL,

    INDEX `Permission_workspaceMemberId_idx`(`workspaceMemberId`),
    INDEX `Permission_teamId_idx`(`teamId`),
    INDEX `Permission_checklistTemplateId_idx`(`checklistTemplateId`),
    INDEX `Permission_projectId_idx`(`projectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IssueAssignee` (
    `issueId` INTEGER NOT NULL,
    `userId` VARCHAR(255) NOT NULL,

    INDEX `IssueAssignee_userId_idx`(`userId`),
    PRIMARY KEY (`issueId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `IssueTeamAssignment` (
    `issueId` INTEGER NOT NULL,
    `teamId` INTEGER NOT NULL,

    INDEX `IssueTeamAssignment_teamId_idx`(`teamId`),
    PRIMARY KEY (`issueId`, `teamId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistAssignmentAssignee` (
    `assignmentId` INTEGER NOT NULL,
    `userId` VARCHAR(255) NOT NULL,

    INDEX `ChecklistAssignmentAssignee_userId_idx`(`userId`),
    PRIMARY KEY (`assignmentId`, `userId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ChecklistAssignmentTeamAssignment` (
    `assignmentId` INTEGER NOT NULL,
    `teamId` INTEGER NOT NULL,

    INDEX `ChecklistAssignmentTeamAssignment_teamId_idx`(`teamId`),
    PRIMARY KEY (`assignmentId`, `teamId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Project` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `workspaceId` INTEGER NOT NULL,

    INDEX `Project_workspaceId_idx`(`workspaceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Task` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `projectId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ChecklistTemplate_workspaceId_idx` ON `ChecklistTemplate`(`workspaceId`);

-- CreateIndex
CREATE INDEX `Issue_workspaceId_idx` ON `Issue`(`workspaceId`);

-- CreateIndex
CREATE INDEX `Issue_createdByUserId_idx` ON `Issue`(`createdByUserId`);

-- AddForeignKey
ALTER TABLE `Team` ADD CONSTRAINT `Team_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkspaceMember` ADD CONSTRAINT `WorkspaceMember_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WorkspaceMember` ADD CONSTRAINT `WorkspaceMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TeamMember` ADD CONSTRAINT `TeamMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Permission` ADD CONSTRAINT `Permission_workspaceMemberId_fkey` FOREIGN KEY (`workspaceMemberId`) REFERENCES `WorkspaceMember`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Permission` ADD CONSTRAINT `Permission_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Permission` ADD CONSTRAINT `Permission_checklistTemplateId_fkey` FOREIGN KEY (`checklistTemplateId`) REFERENCES `ChecklistTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Permission` ADD CONSTRAINT `Permission_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Category` ADD CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `Category`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE `CategoryOnChecklistTemplates` ADD CONSTRAINT `CategoryOnChecklistTemplates_checklistTemplateId_fkey` FOREIGN KEY (`checklistTemplateId`) REFERENCES `ChecklistTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CategoryOnChecklistTemplates` ADD CONSTRAINT `CategoryOnChecklistTemplates_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `Category`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TagOnChecklistTemplates` ADD CONSTRAINT `TagOnChecklistTemplates_checklistTemplateId_fkey` FOREIGN KEY (`checklistTemplateId`) REFERENCES `ChecklistTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TagOnChecklistTemplates` ADD CONSTRAINT `TagOnChecklistTemplates_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `Tag`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistTemplate` ADD CONSTRAINT `ChecklistTemplate_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistTemplate` ADD CONSTRAINT `ChecklistTemplate_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistItem` ADD CONSTRAINT `ChecklistItem_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `ChecklistTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistAssignment` ADD CONSTRAINT `ChecklistAssignment_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `ChecklistTemplate`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistResponse` ADD CONSTRAINT `ChecklistResponse_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `ChecklistAssignment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistResponse` ADD CONSTRAINT `ChecklistResponse_itemId_fkey` FOREIGN KEY (`itemId`) REFERENCES `ChecklistItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Issue` ADD CONSTRAINT `Issue_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Issue` ADD CONSTRAINT `Issue_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IssueAssignee` ADD CONSTRAINT `IssueAssignee_issueId_fkey` FOREIGN KEY (`issueId`) REFERENCES `Issue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IssueAssignee` ADD CONSTRAINT `IssueAssignee_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IssueTeamAssignment` ADD CONSTRAINT `IssueTeamAssignment_issueId_fkey` FOREIGN KEY (`issueId`) REFERENCES `Issue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `IssueTeamAssignment` ADD CONSTRAINT `IssueTeamAssignment_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistAssignmentAssignee` ADD CONSTRAINT `ChecklistAssignmentAssignee_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `ChecklistAssignment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistAssignmentAssignee` ADD CONSTRAINT `ChecklistAssignmentAssignee_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistAssignmentTeamAssignment` ADD CONSTRAINT `ChecklistAssignmentTeamAssignment_assignmentId_fkey` FOREIGN KEY (`assignmentId`) REFERENCES `ChecklistAssignment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ChecklistAssignmentTeamAssignment` ADD CONSTRAINT `ChecklistAssignmentTeamAssignment_teamId_fkey` FOREIGN KEY (`teamId`) REFERENCES `Team`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Project` ADD CONSTRAINT `Project_workspaceId_fkey` FOREIGN KEY (`workspaceId`) REFERENCES `Workspace`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ResponseIssues` ADD CONSTRAINT `_ResponseIssues_A_fkey` FOREIGN KEY (`A`) REFERENCES `ChecklistResponse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_ResponseIssues` ADD CONSTRAINT `_ResponseIssues_B_fkey` FOREIGN KEY (`B`) REFERENCES `Issue`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
