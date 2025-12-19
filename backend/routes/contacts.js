const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.post('/add', auth, userController.addContact);
router.get('/', auth, userController.getContacts);
router.delete('/:id', auth, userController.removeContact);

module.exports = router;

