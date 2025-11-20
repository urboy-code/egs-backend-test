# EGS School Schedule API (Backend)

Backend service untuk Sistem Jadwal Pelajaran Sekolah, dibangun sebagai bagian dari Seleksi Full Stack Programmer Yayasan Kreasi Edulab Indonesia.

Aplikasi ini menyediakan RESTful API untuk mengelola jadwal pelajaran, autentikasi pengguna, serta fitur import/export data jadwal menggunakan Excel.

**Live Demo / Base URL:** https://egs-backend-test-production.up.railway.app
**API Documentation (Swagger):** https://egs-backend-test-production.up.railway.app/api-docs

## 🛠 Tech Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** PostgreSQL
* **ORM/Migration:** node-pg-migrate
* **Excel Processing:** xlsx, multer
* **Infrastructure:** Docker (Local), Railway (Production)

## ✨ Fitur Utama

1.  **Autentikasi API Key**: Melindungi endpoint dengan header `x-api-key`.
2.  **CRUD Jadwal**: Mengelola data jadwal pelajaran (Create, Read, Update, Delete).
3.  **Role-Based Endpoints**:
    * Jadwal Siswa (Filter per kelas & tanggal).
    * Jadwal Guru (Filter per NIK & rentang tanggal + Total JP).
    * Rekapitulasi Yayasan (JSON report).
4.  **Excel Integration**:
    * **Import:** Upload jadwal massal via file `.xlsx`.
    * **Export:** Download laporan rekapitulasi jadwal dengan formatting (Merge Cells) via `.xlsx`.

## 🚀 Cara Menjalankan (Local Development)

### Prasyarat
* Node.js (v16+)
* Docker & Docker Compose

### Instalasi
1.  Clone repository:
    ```bash
    git clone [https://github.com/urboy-code/egs-backend-test.git](https://github.com/urboy-code/egs-backend-test.git)
    cd egs-backend-test
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Setup Environment Variables:
    Buat file `.env` dan sesuaikan (lihat `.env.example` jika ada, atau gunakan konfigurasi default Docker):
    ```env
    PORT=3000
    DATABASE_URL=postgres://postgres:postgres@localhost:5435/egs_school
    API_KEY=SECRET123
    ```

4.  Jalankan Database (Docker):
    ```bash
    docker compose up -d
    ```

5.  Jalankan Migrasi Database:
    ```bash
    npm run migrate:up
    ```

6.  Jalankan Server:
    ```bash
    npm run dev
    ```

## 📝 Endpoint List

| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| POST | `/api/schedules` | Tambah jadwal baru |
| GET | `/api/schedules` | Lihat semua jadwal |
| PUT | `/api/schedules/:id` | Update jadwal |
| DELETE | `/api/schedules/:id` | Hapus jadwal |
| GET | `/api/schedules/student` | Lihat jadwal spesifik siswa |
| GET | `/api/schedules/teacher` | Lihat jadwal & JP guru |
| GET | `/api/schedules/report/rekap-jp`| Rekapitulasi Yayasan (JSON) |
| POST | `/api/schedules/upload` | Upload file Excel |
| GET | `/api/schedules/export/data` | Download laporan Excel |

---
Built with ❤️ by **Eka Setiyanto**