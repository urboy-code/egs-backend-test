/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.up = (pgm) => {
  pgm.createExtension('uuid-ossp', { ifNotExists: true });

  pgm.createTable('schedules', {
    id: {
      type: 'uuid',
      primaryKey: true,
      default: pgm.func('uuid_generate_v4()'),
    },
    class_code: {
      type: 'varchar(10)',
      notNull: true, // contoh: "XA01"
    },
    class_name: {
      type: 'varchar(10)',
      notNull: true, // contoh: "X-A"
    },
    subject_code: {
      type: 'varchar(10)',
      notNull: true, // contoh: "BIO"
    },
    teacher_nik: {
      type: 'varchar(20)',
      notNull: true, // NIK guru
    },
    teacher_name: {
      type: 'varchar(100)',
      notNull: true, // Nama Guru
    },
    date: {
      type: 'date',
      notNull: true, // Tanggal Pelajaran
    },
    jam_ke: {
      type: 'integer',
      notNull: true, // Jam ke (1,2,3,...)
    },
    time_start: {
      type: 'time',
      notNull: true, // waktu mulai, contoh: 08:40:00
    },
    time_end: {
      type: 'time',
      notNull: true, // waktu selesai, contoh: 09:20
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
exports.down = (pgm) => {
  pgm.dropTable('schedules');
};
