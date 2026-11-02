const express = require('express');
const router = express.Router();
module.exports = router;

const authController = require('../controllers/auth.controller');

router.post('/login', authController.longin);
module.exports = router;