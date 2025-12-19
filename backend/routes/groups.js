const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const groupController = require('../controllers/groupController');

router.post('/create', auth, groupController.createGroup);
router.post('/addMember', auth, groupController.addMember);
router.delete('/removeMember', auth, groupController.removeMember);
router.put('/:id', auth, groupController.updateGroup);
router.post('/makeAdmin', auth, groupController.makeAdmin);
router.post('/removeAdmin', auth, groupController.removeAdmin);
router.get('/:id', auth, groupController.getGroup);

module.exports = router;
