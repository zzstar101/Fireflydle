-- 周赛日程绑定当周内容模式；已有日程保持普通角色语义。
ALTER TABLE weekly_schedules ADD COLUMN mode_id TEXT NOT NULL DEFAULT 'playable';

CREATE INDEX weekly_schedules_mode_idx ON weekly_schedules(mode_id, week_key);
