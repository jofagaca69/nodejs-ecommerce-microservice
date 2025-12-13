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
      // Verificar que el usuario esté autenticado (el middleware ya lo hizo, pero verificamos req.user)
      if (!req.user || !req.user.username) {
        console.error('[createOrder] User not authenticated or username missing');
        return res.status(401).json({ message: "Usuario no autenticado" });
      }

      const { ids } = req.body;
      
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ message: "Se requieren IDs de productos válidos" });
      }

      const products = await Product.find({ _id: { $in: ids } });
      
      if (products.length === 0) {
        return res.status(404).json({ message: "No se encontraron productos con los IDs proporcionados" });
      }

      const orderId = uuid.v4(); // Generate a unique order ID
      const username = req.user.username; // Usar el username del token decodificado
      console.log(`[Order ${orderId}] Creating order for user ${username} with ${products.length} products`);
      
      this.ordersMap.set(orderId, {
        status: "pending",
        products,
        username: username,
        createdAt: new Date()
      });

      // Setup message consumer callback for this specific order
      const completionCallback = (data) => {
        try {
          const orderData = JSON.parse(JSON.stringify(data));
          const { orderId: receivedOrderId } = orderData;
          
          if (receivedOrderId === orderId) {
            const order = this.ordersMap.get(orderId);
            if (order) {
              // update the order in the map
              this.ordersMap.set(orderId, { ...order, ...orderData, status: 'completed' });
              console.log(`[Order ${orderId}] Order completed successfully`);
            }
          }
        } catch (err) {
          console.error(`[Order ${orderId}] Error processing completion callback:`, err);
        }
      };

      // Register callback for this orderId (consumer is set up once at startup)
      messageBroker.registerOrderCallback(orderId, completionCallback);
      
      // Ensure consumer is set up (this is idempotent, only sets up once)
      await messageBroker.setupProductsConsumer();

      // Check if RabbitMQ is ready before publishing
      if (!messageBroker.isReady()) {
        console.error(`[Order ${orderId}] RabbitMQ is not connected. Channel: ${messageBroker.channel ? 'exists' : 'null'}, Connected: ${messageBroker.isConnected}`);
        this.ordersMap.delete(orderId);
        // Clean up callback if RabbitMQ is not ready
        messageBroker.removeOrderCallback(orderId);
        return res.status(503).json({ 
          message: "El servicio de mensajería no está disponible en este momento. Por favor, verifica que RabbitMQ esté corriendo e intenta nuevamente.",
          orderId: orderId,
          error: "RABBITMQ_NOT_AVAILABLE"
        });
      }

      // Publish message to orders queue
      const publishResult = await messageBroker.publishMessage("orders", {
        products,
        username: username, // Usar la variable username que ya validamos
        orderId, // include the order ID in the message to orders queue
      });

      if (!publishResult) {
        console.error(`[Order ${orderId}] Failed to publish message to orders queue`);
        this.ordersMap.delete(orderId);
        // Clean up callback on publish failure
        messageBroker.removeOrderCallback(orderId);
        return res.status(503).json({ 
          message: "No se pudo procesar la orden. Por favor, intenta nuevamente.",
          orderId: orderId
        });
      }

      console.log(`[Order ${orderId}] Message published, waiting for completion...`);

      // Long polling until order is completed with timeout
      const MAX_WAIT_TIME = 30000; // 30 seconds timeout
      const POLL_INTERVAL = 500; // Check every 500ms for faster response
      const startTime = Date.now();
      
      let order = this.ordersMap.get(orderId);
      while (order && order.status !== 'completed') {
        // Check if timeout has been exceeded
        const elapsed = Date.now() - startTime;
        if (elapsed > MAX_WAIT_TIME) {
          console.error(`[Order ${orderId}] Timed out after ${elapsed}ms`);
          this.ordersMap.delete(orderId);
          // Clean up callback on timeout
          messageBroker.removeOrderCallback(orderId);
          return res.status(504).json({ 
            message: "La orden está tomando más tiempo del esperado. Por favor, intenta nuevamente.",
            orderId: orderId
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        order = this.ordersMap.get(orderId);
      }

      // Get final order state
      const finalOrder = this.ordersMap.get(orderId);
      
      if (!finalOrder || finalOrder.status !== 'completed') {
        console.error(`[Order ${orderId}] Order not completed, current status: ${finalOrder?.status || 'missing'}`);
        this.ordersMap.delete(orderId);
        // Clean up callback
        messageBroker.removeOrderCallback(orderId);
        return res.status(500).json({ 
          message: "Error procesando la orden. Por favor, intenta nuevamente.",
          orderId: orderId
        });
      }

      // Once the order is marked as completed, return the complete order details
      console.log(`[Order ${orderId}] Returning completed order`);
      // Clean up callback and order from map
      this.ordersMap.delete(orderId);
      messageBroker.removeOrderCallback(orderId);
      return res.status(201).json(finalOrder);
    } catch (error) {
      console.error('[createOrder] Error:', error);
      res.status(500).json({ message: "Error del servidor. Por favor, intenta nuevamente." });
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
