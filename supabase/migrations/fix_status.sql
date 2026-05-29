-- Permite que o status "late" seja salvo no banco de dados para provas e atividades entregues com atraso.
ALTER TABLE exam_submissions DROP CONSTRAINT IF EXISTS exam_submissions_status_check;
ALTER TABLE exam_submissions ADD CONSTRAINT exam_submissions_status_check CHECK (status IN ('submitted', 'late', 'graded'));

ALTER TABLE activity_submissions DROP CONSTRAINT IF EXISTS activity_submissions_status_check;
ALTER TABLE activity_submissions ADD CONSTRAINT activity_submissions_status_check CHECK (status IN ('submitted', 'late', 'graded'));
