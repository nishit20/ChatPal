const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const messageController = require('../controllers/messageController');

router.post('/', auth, messageController.createMessage);
router.put('/:id/edit', auth, messageController.editMessage);
router.delete('/:id/delete', auth, messageController.deleteMessage);
router.post('/:id/react', auth, messageController.reactToMessage);
router.post('/:id/read', auth, messageController.markMessageRead);
router.post('/chat/:chatId/read', auth, messageController.markChatRead);

module.exports = router;

