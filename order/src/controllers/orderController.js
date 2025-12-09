const Order = require('../models/order');

class OrderController {
  constructor() {
    // Bind methods to this instance
    this.getAllOrders = this.getAllOrders.bind(this);
    this.getOrdersByDateRange = this.getOrdersByDateRange.bind(this);
    this.getDashboardStats = this.getDashboardStats.bind(this);
  }

  // Obtener todas las órdenes con límite
  async getAllOrders(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 100;
      const orders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      // Transformar para incluir información de productos
      const transformedOrders = orders.map(order => ({
        _id: order._id,
        userId: order.user,
        username: order.user,
        products: order.products.map(product => ({
          productId: product._id || product,
          name: 'Producto', // Placeholder - idealmente obtener del servicio de productos
          quantity: 1,
          price: order.totalPrice / order.products.length
        })),
        total: order.totalPrice,
        status: 'completed',
        createdAt: order.createdAt
      }));

      res.json(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ error: 'Error al obtener las órdenes' });
    }
  }

  // Obtener órdenes por rango de fechas
  async getOrdersByDateRange(req, res) {
    try {
      const { start, end } = req.query;
      
      if (!start || !end) {
        return res.status(400).json({ error: 'Se requieren fechas de inicio y fin' });
      }

      const orders = await Order.find({
        createdAt: {
          $gte: new Date(start),
          $lte: new Date(end)
        }
      })
        .sort({ createdAt: -1 })
        .lean();

      const transformedOrders = orders.map(order => ({
        _id: order._id,
        userId: order.user,
        username: order.user,
        products: order.products.map(product => ({
          productId: product._id || product,
          name: 'Producto',
          quantity: 1,
          price: order.totalPrice / order.products.length
        })),
        total: order.totalPrice,
        status: 'completed',
        createdAt: order.createdAt
      }));

      res.json(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders by date range:', error);
      res.status(500).json({ error: 'Error al obtener las órdenes' });
    }
  }

  // Obtener estadísticas del dashboard
  async getDashboardStats(req, res) {
    try {
      // Total de ventas
      const totalSales = await Order.countDocuments();

      // Total de ingresos
      const revenueResult = await Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ]);
      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

      // Ventas recientes (últimos 7 días)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentSales = await Order.countDocuments({
        createdAt: { $gte: sevenDaysAgo }
      });

      // Nota: inventoryValue y lowStockProducts se obtendrían del servicio de productos
      // Por ahora retornamos valores por defecto
      const stats = {
        totalSales,
        totalRevenue,
        inventoryValue: 0, // Se debe obtener del servicio de productos
        lowStockProducts: 0, // Se debe obtener del servicio de productos
        recentSales
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Error al obtener las estadísticas' });
    }
  }
}

module.exports = new OrderController();
