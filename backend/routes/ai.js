const express = require('express');
const router = express.Router();
const { aiChat } = require('../controllers/aiController');
const { auth } = require('../middleware/auth');

router.post('/chat', auth, aiChat);

module.exports = router;
