const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/me', auth, userController.getMe);
router.get('/search', auth, userController.searchUsers);
router.get('/searchByPhone', auth, userController.searchByPhone);
router.get('/:id', auth, userController.getUser);
router.put('/:id', auth, userController.updateUser);
router.delete('/profile-picture', auth, userController.removeProfilePicture);
router.post('/change-password', auth, userController.changePassword);
router.delete('/account', auth, userController.deleteAccount);

module.exports = router;
