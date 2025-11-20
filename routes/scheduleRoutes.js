const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/authMiddleware');
const excleController = require('../controllers/excelController');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

// Excle
router.post('/upload', upload.single('file_excel'), excleController.uploadSchedule);
router.get('/export/data', excleController.exportRekap);
router.get('/report/rekap-jp', scheduleController.getRekapJP);

// Route Role
router.get('/student', scheduleController.getStudentSchedule);
router.get('/teacher', scheduleController.getTeacherSchedule);

router.get('/', scheduleController.getAllSchedules);
router.post('/', scheduleController.createSchedule);
router.put('/:id', scheduleController.updateSchedule);
router.delete('/:id', scheduleController.deleteSchedule);

module.exports = router;
