const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Rutas de órdenes
router.get('/orders', orderController.getAllOrders);
router.get('/orders/range', orderController.getOrdersByDateRange);

// Rutas del dashboard
router.get('/dashboard/stats', orderController.getDashboardStats);

module.exports = router;
