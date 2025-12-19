const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const searchController = require('../controllers/searchController');

router.get('/users', auth, searchController.searchUsers);
router.get('/chats', auth, searchController.searchChats);
router.get('/messages/:chatId', auth, searchController.searchMessages);

module.exports = router;

