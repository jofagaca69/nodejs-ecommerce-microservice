const Product = require("../models/product");
const messageBroker = require("../utils/messageBroker");
const uuid = require('uuid');

const ProductsService = require("../services/productsService");

const productsService = new ProductsService();

/**
 * Class to hold the API implementation for the product services
 */
class ProductController {

  constructor() {
    this.createOrder = this.createOrder.bind(this);
    this.getOrderStatus = this.getOrderStatus.bind(this);
    this.ordersMap = new Map();

  }

  async createProduct(req, res, next) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const product = new Product(req.body);

      const validationError = product.validateSync();
      if (validationError) {
        return res.status(400).json({ message: validationError.message });
      }

      await product.save({ timeout: 30000 });

      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      // Si es un error de validación de Mongoose, retornar 400
      if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: "Server error" });
    }
  }

  async createOrder(req, res, next) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { ids } = req.body;
      const products = await Product.find({ _id: { $in: ids } });

      const orderId = uuid.v4(); // Generate a unique order ID
      this.ordersMap.set(orderId, {
        status: "pending",
        products,
        username: req.user.username
      });

      await messageBroker.publishMessage("orders", {
        products,
        username: req.user.username,
        orderId, // include the order ID in the message to orders queue
      });

      messageBroker.consumeMessage("products", (data) => {
        const orderData = JSON.parse(JSON.stringify(data));
        const { orderId } = orderData;
        const order = this.ordersMap.get(orderId);
        if (order) {
          // update the order in the map
          this.ordersMap.set(orderId, { ...order, ...orderData, status: 'completed' });
          console.log("Updated order:", order);
        }
      });

      // Long polling until order is completed
      let order = this.ordersMap.get(orderId);
      while (order.status !== 'completed') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // wait for 1 second before checking status again
        order = this.ordersMap.get(orderId);
      }

      // Once the order is marked as completed, return the complete order details
      return res.status(201).json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }


  async getOrderStatus(req, res, next) {
    const { orderId } = req.params;
    const order = this.ordersMap.get(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.status(200).json(order);
  }

  async getProducts(req, res, next) {
    try {
      const { category } = req.query;

      // Build filter object
      const filter = {};
      if (category) {
        filter.categories = category;
      }

      const products = await Product.find(filter).populate('categories');

      res.status(200).json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }

  async deleteTestProducts(req, res) {
    try {
      const result = await productsService.deleteTestProducts();
      return res.status(200).json({
        message: `${result.deletedCount} productos de prueba eliminados`
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar productos de prueba" });
    }
  }

  // Obtener estadísticas del inventario
  async getInventoryStats(req, res) {
    try {
      const totalProducts = await Product.countDocuments();
      
      const valueResult = await Product.aggregate([
        {
          $group: {
            _id: null,
            totalValue: { $sum: { $multiply: ['$price', '$stock'] } }
          }
        }
      ]);
      const totalValue = valueResult.length > 0 ? valueResult[0].totalValue : 0;

      const lowStockCount = await Product.countDocuments({ stock: { $lte: 10 } });

      const categories = await Product.distinct('categories');
      const categoriesCount = categories.length;

      res.json({
        totalProducts,
        totalValue,
        lowStockCount,
        categoriesCount
      });
    } catch (error) {
      console.error('Error getting inventory stats:', error);
      res.status(500).json({ message: 'Error al obtener estadísticas del inventario' });
    }
  }

  // Obtener productos con stock bajo
  async getLowStockProducts(req, res) {
    try {
      const threshold = parseInt(req.query.threshold) || 10;
      const products = await Product.find({ stock: { $lte: threshold } })
        .populate('categories')
        .sort({ stock: 1 });
      
      res.json(products);
    } catch (error) {
      console.error('Error getting low stock products:', error);
      res.status(500).json({ message: 'Error al obtener productos con stock bajo' });
    }
  }

  // Actualizar stock de un producto
  async updateProductStock(req, res) {
    try {
      const { id } = req.params;
      const { stock } = req.body;

      if (stock === undefined || stock < 0) {
        return res.status(400).json({ message: 'Stock inválido' });
      }

      const product = await Product.findByIdAndUpdate(
        id,
        { stock },
        { new: true, runValidators: true }
      ).populate('categories');

      if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      res.json(product);
    } catch (error) {
      console.error('Error updating product stock:', error);
      res.status(500).json({ message: 'Error al actualizar el stock del producto' });
    }
  }
}

module.exports = ProductController;
