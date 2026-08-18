-- 多人归档显式保存活动，永久 ELO 只认普通角色正式随机匹配。
ALTER TABLE matches ADD COLUMN activity_id TEXT NOT NULL DEFAULT 'private-room';

UPDATE matches
SET activity_id = 'ranked-match'
WHERE ranked = 1;
