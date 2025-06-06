-- AlterTable
ALTER TABLE `category` ADD COLUMN `parentId` INTEGER NULL;

-- AlterTable
ALTER TABLE `tag` ADD COLUMN `color` VARCHAR(20) NOT NULL DEFAULT 'gray';
