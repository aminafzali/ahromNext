-- CreateIndex
CREATE INDEX `Account_userId_idx` ON `Account`(`userId`);

-- CreateIndex
CREATE INDEX `Issue_assignedToUserId_idx` ON `Issue`(`assignedToUserId`);

-- CreateIndex
CREATE INDEX `Session_userId_idx` ON `Session`(`userId`);
