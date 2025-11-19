const db = require('../config/db');

// Get All Schedule
exports.getAllSchedules = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM schedules ORDER BY date DESC, jam_ke ASC');

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Schedule Not Found!' });
    }
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Faild to get schedules',
    });
  }
};

// Create Schedule
exports.createSchedule = async (req, res) => {
  const { class_code, class_name, subject_code, teacher_nik, teacher_name, date, jam_ke, time_start, time_end } =
    req.body;

  try {
    const query = `
      INSERT INTO schedules
      (class_code, class_name, subject_code, teacher_nik, teacher_name, date, jam_ke, time_start, time_end)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `;
    const values = [
      class_code,
      class_name,
      subject_code,
      teacher_nik,
      teacher_name,
      date,
      jam_ke,
      time_start,
      time_end,
    ];

    const result = await db.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create schedule' });
  }
};

// Update Schedule
exports.updateSchedule = async (req, res) => {
  const { id } = req.params;
  const { class_code, class_name, subject_code, teacher_nik, teacher_name, date, jam_ke, time_start, time_end } =
    req.body;

  try {
    const query = `
      UPDATE schedules SET
      class_code = $1, class_name = $2, subject_code = $3, teacher_nik = $4, teacher_name = $5, date=$6, jam_ke=$7, time_start=$8, time_end=$9, updated_at=CURRENT_TIMESTAMP WHERE id=$10 RETURNING *
    `;
    const values = [
      class_code,
      class_name,
      subject_code,
      teacher_nik,
      teacher_name,
      date,
      jam_ke,
      time_start,
      time_end,
      id,
    ];
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule Not Found!' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.json(500).json({ message: 'Failed to update schedule!' });
  }
};

// Delete Schedule
exports.deleteSchedule = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM schedules WHERE id=$1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Schedule Not Found!' });
    }

    res.json({
      message: 'Schedule Deleted!',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete schedule!' });
  }
};
