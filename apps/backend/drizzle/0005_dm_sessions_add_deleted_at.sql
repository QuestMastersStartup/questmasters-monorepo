-- Add soft-delete column to dm_sessions (was in 0002_dm_session_soft_delete.sql,
-- lost when migrations were reorganized in 209795b)
ALTER TABLE `dm_sessions` ADD COLUMN `deleted_at` INTEGER DEFAULT NULL;
