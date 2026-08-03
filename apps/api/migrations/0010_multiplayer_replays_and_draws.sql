ALTER TABLE matches
ADD COLUMN resolution TEXT
CHECK (
  resolution IS NULL OR resolution IN (
    'score', 'agreed-draw', 'disconnect', 'left', 'cancelled'
  )
);

UPDATE matches
SET resolution = CASE
  WHEN finish_reason = 'three-draws' THEN 'cancelled'
  ELSE finish_reason
END
WHERE resolution IS NULL;

ALTER TABLE match_rounds
ADD COLUMN target_json TEXT
CHECK (target_json IS NULL OR json_valid(target_json));
