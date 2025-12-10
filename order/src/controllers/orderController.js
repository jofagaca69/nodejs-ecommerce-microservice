const Order = require('../models/order');
const axios = require('axios');

class OrderController {
  constructor() {
    // Bind methods to this instance
    this.getAllOrders = this.getAllOrders.bind(this);
    this.getOrdersByDateRange = this.getOrdersByDateRange.bind(this);
    this.getDashboardStats = this.getDashboardStats.bind(this);
  }

  /**
   * Calculate time period boundaries in UTC
   * @param {string} period - 'day', 'week', or 'month'
   * @returns {Object} Object with start and end dates
   */
  calculateTimePeriod(period) {
    const now = new Date();
    const end = new Date(now.getTime());
    let start;

    switch (period) {
      case 'day':
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Last 24 hours
        break;
      case 'week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
        break;
      case 'month':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Last 30 days
        break;
      default:
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to day
    }

    return { start, end };
  }

  /**
   * Fetch inventory stats from Product service via API Gateway
   * @param {string} authToken - JWT token for authentication
   * @returns {Promise<Object>} Inventory stats object
   */
  async fetchInventoryStats(authToken) {
    try {
      // Opción 1: Llamar directamente al Product service (más confiable)
      const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product:3001';
      const directUrl = `${productServiceUrl}/api/products/inventory/stats`;
      
      // Opción 2: Llamar a través del API Gateway
      const apiGatewayUrl = process.env.API_GATEWAY_URL || 'http://api-gateway:3003';
      const gatewayUrl = `${apiGatewayUrl}/products/api/products/inventory/stats`;
      
      // Intentar primero con el API Gateway, si falla intentar directo
      let response;
      try {
        response = await axios.get(gatewayUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        console.log(`[fetchInventoryStats] Success via API Gateway:`, response.data);
      } catch (gatewayError) {
        console.warn(`[fetchInventoryStats] API Gateway failed, trying direct connection:`, gatewayError.message);
        // Intentar conexión directa al Product service
        response = await axios.get(directUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        console.log(`[fetchInventoryStats] Success via direct connection:`, response.data);
      }
      
      return {
        inventoryValue: response.data.totalValue || 0,
        lowStockProducts: response.data.lowStockCount || 0
      };
    } catch (error) {
      console.error('Error fetching inventory stats from Product service:', error.message);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Request URL:', error.config?.url);
      }
      // Return default values if Product service is unavailable
      return {
        inventoryValue: 0,
        lowStockProducts: 0
      };
    }
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
      // Get period from query parameter (default: 'day')
      const period = req.query.period || 'day';
      
      // Validate period parameter
      if (!['day', 'week', 'month'].includes(period)) {
        return res.status(400).json({ error: 'Period must be one of: day, week, month' });
      }

      // Calculate time period boundaries
      const { start, end } = this.calculateTimePeriod(period);

      // Total de ventas (all time)
      const totalSales = await Order.countDocuments();

      // Total de ingresos (all time)
      const revenueResult = await Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ]);
      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

      // Ventas recientes (within selected period)
      const recentSales = await Order.countDocuments({
        createdAt: {
          $gte: start,
          $lte: end
        }
      });

      // Fetch inventory stats from Product service
      const authToken = req.headers.authorization?.replace('Bearer ', '') || '';
      const inventoryStats = await this.fetchInventoryStats(authToken);

      // Log dashboard stats calculation
      console.log(`[Dashboard Stats] Period: ${period}, Recent Sales: ${recentSales}, Inventory Value: ${inventoryStats.inventoryValue}`);

      const stats = {
        totalSales,
        totalRevenue,
        inventoryValue: inventoryStats.inventoryValue,
        lowStockProducts: inventoryStats.lowStockProducts,
        recentSales,
        period
      };

      res.json(stats);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({ error: 'Error al obtener las estadísticas' });
    }
  }
}

module.exports = new OrderController();
