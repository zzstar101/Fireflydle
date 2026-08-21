ALTER TABLE feedback_items ADD COLUMN github_issue_number INTEGER;
ALTER TABLE feedback_items ADD COLUMN github_issue_url TEXT;
ALTER TABLE feedback_items ADD COLUMN github_published_at INTEGER;

CREATE UNIQUE INDEX feedback_items_github_issue_idx
  ON feedback_items(github_issue_number) WHERE github_issue_number IS NOT NULL;
