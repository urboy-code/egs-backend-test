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

// For Student
exports.getStudentSchedule = async (req, res) => {
  try {
    const { class_code, date } = req.query;

    if (!class_code || !date) {
      return res.status(400).json({ error: 'class_code and date required!' });
    }

    const query = `
      SELECT * FROM schedules
      WHERE class_code = $1 AND date = $2
      ORDER BY jam_ke ASC
    `;

    const result = await db.query(query, [class_code, date]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to get student schedule!' });
  }
};

// API for Teacher
exports.getTeacherSchedule = async (req, res) => {
  try {
    const { teacher_nik, start_date, end_date } = req.query;

    if (!teacher_nik || !start_date || !end_date) {
      return res.status(400).json({ error: 'teacher_nik, start_date, end_date required!' });
    }

    const query = `
      SELECT * FROM schedules
      WHERE teacher_nik = $1 AND date BETWEEN $2 AND $3
      ORDER BY date ASC, jam_ke ASC
    `;

    const result = await db.query(query, [teacher_nik, start_date, end_date]);
    const schedules = result.rows;

    const totalJP = schedules.length;
    const teacherName = schedules.length > 0 ? schedules[0].teacher_name : 'Teacher Not Found';

    const response = {
      teacher_name: teacherName,
      periode: {
        start_date,
        end_date,
      },
      total_jp: totalJP,
      jadwal: schedules,
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Faild to get teacher schedule!' });
  }
};

exports.getRekapJP = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Parameter start_date, end_date required' });
    }

    const query = `
      SELECT 
        teacher_nik,
        teacher_name,
        class_name,
        COUNT(id) as jumlah_jp
      FROM schedules
      WHERE date BETWEEN $1 AND $2
      GROUP BY teacher_nik, teacher_name, class_name
      ORDER BY teacher_name, class_name
    `;

    const result = await db.query(query, [start_date, end_date]);
    const rows = result.rows;

    const teachersMap = {};

    rows.forEach((row) => {
      const nik = row.teacher_nik;
      const jp = parseInt(row.jumlah_jp);

      if (!teachersMap[nik]) {
        teachersMap[nik] = {
          teacher_nik: nik,
          teacher_name: row.teacher_name,
          total_jp: 0,
          detail_map: {},
          total_kelas: 0,
        };
      }

      teachersMap[nik].total_jp += jp;

      if (!teachersMap[nik].detail_map[row.class_name]) {
        teachersMap[nik].detail_map[row.class_name] = 0;
        teachersMap[nik].total_kelas++;
      }
      teachersMap[nik].detail_map[row.class_name] += jp;
    });

    const rekapArray = Object.values(teachersMap).map((t) => {
      const detailArray = Object.keys(t.detail_map).map((className) => ({
        class_name: className,
        jumlah_jp: t.detail_map[className],
      }));

      return {
        teacher_nik: t.teacher_nik,
        teacher_name: t.teacher_name,
        total_jp: t.total_jp,
        total_kelas: t.total_kelas,
        detail: detailArray,
      };
    });

    // Response JSON Final
    const response = {
      periode: {
        start_date,
        end_date,
      },
      total_pengajar: rekapArray.length,
      rekap: rekapArray,
    };

    res.json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed To Get Data!' });
  }
};
