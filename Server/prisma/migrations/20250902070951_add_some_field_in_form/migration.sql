/*
  Warnings:

  - Added the required column `github` to the `Form` table without a default value. This is not possible if the table is not empty.
  - Added the required column `linkdin` to the `Form` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Form` ADD COLUMN `github` VARCHAR(191) NOT NULL,
    ADD COLUMN `linkdin` VARCHAR(191) NOT NULL,
    ADD COLUMN `name` VARCHAR(191) NULL;
