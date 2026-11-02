const express = require('express');
const proController = require('../controllers/pro.controller');

const authMiddleware = require('../middlewares/auth.middleware');
const checkPermission = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/', authMiddleware, checkPermission('products.read'), proController.getPros);
router.get('/:id', authMiddleware, checkPermission('products.read'), proController.getProById);

router.post('/', authMiddleware, checkPermission('products.create'), proController.createPro);
router.put('/:id', authMiddleware, checkPermission('products.update'), proController.updatePro);
router.delete('/:id', authMiddleware, checkPermission('products.delete'), proController.deletePro);

module.exports = router;