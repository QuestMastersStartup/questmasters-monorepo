-- Add soft-delete column to dm_sessions (was in 0002_dm_session_soft_delete.sql,
-- lost when migrations were reorganized in 209795b)
-- ponytail: no-op on fresh DBs where 0004 already includes deleted_at; ALTER was only needed on existing prod tables
SELECT 1;
