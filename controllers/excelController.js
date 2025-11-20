const db = require('../config/db');
const xlsx = require('xlsx');

// Import/Upload Schedule
exports.uploadSchedule = async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'File Excel (.xlsx) wajib di upload' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.status(404).json({ error: 'File Excle Empty!' });
    }

    const client = await db.pool.connect();

    let successCount = 0;
    let errorCount = 0;

    for (const row of data) {
      const { class_code, class_name, subject_code, teacher_nik, teacher_name, date, jam_ke, time_start, time_end } =
        row;

      try {
        const query = `
          INSERT INTO schedules
      (class_code, class_name, subject_code, teacher_nik, teacher_name, date, jam_ke, time_start, time_end)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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

        await db.query(query, values);
        successCount++;
      } catch (error) {
        console.error('Failed to insert row: ', row, error.message);
        errorCount++;
      }
    }

    if (client.release) client.release();

    req.json({
      message: `Uploaded. Success: ${successCount}, Gagal: ${errorCount}`,
    });
  } catch (error) {
    console.error(error);
    res.satatus(500).json({ error: 'Failed proccesed the File!' });
  }
};

// Expor Rekap
exports.exportRekap = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({ meesage: ' start_date and end_date ' });
    }

    const query = `
      SELECT 
          teacher_nik,
          teacher_name,
          class_name,
          date
      FROM schedules
      WHERE date BETWEEN $1 AND $2
      ORDER BY teacher_name, date
    `;

    const result = await db.query(query, [start_date, end_date]);
    const rawData = result.rows;

    const teacherMap = {};

    rawData.forEach((row) => {
      const nik = row.teacher_nik;

      // Inisialisasi object guru kalau belum ada
      if (!teacherMap[nik]) {
        teacherMap[nik] = {
          nik: nik,
          name: row.teacher_name,
          classes: new Set(), // Pakai Set biar nama kelas gak duplikat
          weeks: [0, 0, 0, 0, 0], // Array untuk Pekan 1 - 5
          total: 0,
        };
      }

      // Catat kelas
      teacherMap[nik].classes.add(row.class_name);

      // Hitung Pekan (Logika Sederhana: Tanggal 1-7 = Pekan 1, dst)
      const d = new Date(row.date);
      const dateNum = d.getDate();
      // Rumus: (Tanggal - 1) / 7 -> dibulatkan ke bawah
      // Contoh: Tgl 1 -> 0 (Pekan 1), Tgl 8 -> 1 (Pekan 2)
      let weekIndex = Math.floor((dateNum - 1) / 7);

      // Jaga-jaga kalau tanggal 29-31 masuk Pekan 5
      if (weekIndex > 4) weekIndex = 4;

      teacherMap[nik].weeks[weekIndex]++; // Tambah 1 JP di pekan tersebut
      teacherMap[nik].total++; // Tambah Total JP
    });

    // 3. Bikin Struktur Data untuk Excel (Array of Arrays)
    const excelData = [];

    // Baris 1: Header Utama (Nanti di-merge)
    // Kolom kosong ("") disiapin buat tempat merge
    const header1 = [
      'No',
      'NIK',
      'Nama Pengajar',
      'Kelas yg Diajar',
      'Total Jam Pelajaran Per Pekan',
      '',
      '',
      '',
      '', // Ini bakal di-merge 5 kolom
      'Total JP',
    ];
    excelData.push(header1);

    // Baris 2: Sub-Header (Pekan 1, Pekan 2, dst)
    const header2 = [
      '',
      '',
      '',
      '', // Kosong karena ketutup merge atasnya
      'Pekan 1',
      'Pekan 2',
      'Pekan 3',
      'Pekan 4',
      'Pekan 5',
      '',
    ];
    excelData.push(header2);

    // Baris Data (Loop dari teacherMap)
    let no = 1;
    Object.values(teacherMap).forEach((t) => {
      const row = [
        no++,
        t.nik,
        t.name,
        Array.from(t.classes).join(', '), // Ubah Set jadi string "X-A, X-B"
        t.weeks[0], // Pekan 1
        t.weeks[1],
        t.weeks[2],
        t.weeks[3],
        t.weeks[4], // Pekan 5
        t.total, // Total JP
      ];
      excelData.push(row);
    });

    // 4. Bikin Worksheet & Atur Merge Cells
    const worksheet = xlsx.utils.aoa_to_sheet(excelData);

    // Indeks dimulai dari 0
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }, // Merge "No" (Baris 0-1, Kolom 0)
      { s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }, // Merge "NIK"
      { s: { r: 0, c: 2 }, e: { r: 1, c: 2 } }, // Merge "Nama Pengajar"
      { s: { r: 0, c: 3 }, e: { r: 1, c: 3 } }, // Merge "Kelas yg Diajar"
      { s: { r: 0, c: 4 }, e: { r: 0, c: 8 } }, // Merge Header "Total Jam..." (Kolom 4 sampai 8)
      { s: { r: 0, c: 9 }, e: { r: 1, c: 9 } }, // Merge "Total JP"
    ];

    // Atur lebar kolom biar rapi (Opsional)
    worksheet['!cols'] = [
      { wch: 5 }, // No
      { wch: 15 }, // NIK
      { wch: 25 }, // Nama
      { wch: 20 }, // Kelas
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 }, // Pekan 1-5
      { wch: 10 }, // Total JP
    ];

    // 5. Finalisasi & Kirim
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Rekap JP');

    const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename="rekap_jadwal_lengkap.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);
  } catch (error) {
    console.error(err);
    res.status(500).json({ error: 'Gagal export Excel' });
  }
};
