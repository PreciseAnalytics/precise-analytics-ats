exports.up = async (pgm) => {
  await pgm.db.query(`
    ALTER TABLE applications
    DROP CONSTRAINT IF EXISTS applications_job_id_fkey;
  `);
  await pgm.db.query(`
    UPDATE applications
    SET job_id = (SELECT id FROM jobs LIMIT 1)
    WHERE job_id IS NULL;
  `);
  await pgm.db.query(`
    ALTER TABLE applications
    ALTER COLUMN job_id SET NOT NULL
    WHERE job_id IS NOT NULL;
  `);
  await pgm.db.query(`
    ALTER TABLE applications
    ADD CONSTRAINT applications_job_id_fkey
    FOREIGN KEY (job_id) REFERENCES jobs(id);
  `);
};

exports.down = async (pgm) => {
  await pgm.db.query(`
    ALTER TABLE applications
    DROP CONSTRAINT IF EXISTS applications_job_id_fkey;
  `);
};