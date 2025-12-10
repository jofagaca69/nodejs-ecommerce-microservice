const mongoose = require("mongoose");
const Order = require("../../src/models/order");
const config = require("../../src/config");

describe("Order Service <--> MongoDB Integration Tests", () => {
  beforeAll(async () => {
    // Conectar a MongoDB
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterEach(async () => {
    // Limpiar órdenes de prueba después de cada test
    await Order.deleteMany({ user: /^testuser/ });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("ORDER-INT-001: Debe crear y persistir una orden en MongoDB", async () => {
    // Arrange: Preparar datos de orden con ObjectIds válidos
    const productId1 = new mongoose.Types.ObjectId();
    const productId2 = new mongoose.Types.ObjectId();
    
    const orderData = {
      products: [productId1, productId2],
      user: "testuser_order001",
      totalPrice: 1024.99
    };

    // Act: Crear y guardar la orden directamente
    const newOrder = new Order(orderData);
    await newOrder.save();

    // Assert: Verificar que la orden existe en MongoDB
    const orderInDb = await Order.findOne({ user: orderData.user });
    
    expect(orderInDb).not.toBeNull();
    expect(orderInDb.user).toBe(orderData.user);
    expect(orderInDb.products).toHaveLength(2);
    expect(orderInDb.totalPrice).toBe(1024.99);
    expect(orderInDb.products[0].toString()).toBe(productId1.toString());
  });

  it("ORDER-INT-002: Debe calcular y persistir correctamente el precio total", async () => {
    // Arrange
    const products = [
      { price: 10.50 },
      { price: 20.75 },
      { price: 5.25 }
    ];
    const totalPrice = products.reduce((acc, p) => acc + p.price, 0);
    
    const orderData = {
      products: [
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId(),
        new mongoose.Types.ObjectId()
      ],
      user: "testuser_price",
      totalPrice: totalPrice
    };

    // Act
    const newOrder = new Order(orderData);
    await newOrder.save();

    // Assert
    const order = await Order.findOne({ user: orderData.user });
    
    const expectedTotal = 10.50 + 20.75 + 5.25;
    expect(order.totalPrice).toBeCloseTo(expectedTotal, 2);
  });

  it("ORDER-INT-003: Debe validar el esquema correcto en MongoDB", async () => {
    // Arrange
    const orderData = {
      products: [new mongoose.Types.ObjectId()],
      user: "testuser_schema",
      totalPrice: 100
    };

    // Act
    const newOrder = new Order(orderData);
    await newOrder.save();

    // Assert
    const order = await Order.findOne({ user: orderData.user }).lean();
    
    expect(order).toHaveProperty("_id");
    expect(order).toHaveProperty("user");
    expect(order).toHaveProperty("products");
    expect(order).toHaveProperty("totalPrice");
    expect(order).toHaveProperty("createdAt");
    expect(Array.isArray(order.products)).toBe(true);
    expect(typeof order.totalPrice).toBe("number");
    expect(order.createdAt).toBeInstanceOf(Date);
  });

  it("ORDER-INT-004: Debe manejar órdenes con productos vacíos", async () => {
    // Arrange
    const orderData = {
      products: [],
      user: "testuser_empty",
      totalPrice: 0
    };

    // Act
    const newOrder = new Order(orderData);
    await newOrder.save();

    // Assert
    const order = await Order.findOne({ user: orderData.user });
    
    expect(order).not.toBeNull();
    expect(order.products).toHaveLength(0);
    expect(order.totalPrice).toBe(0);
  });

  it("ORDER-INT-005: Debe rechazar órdenes sin campo user requerido", async () => {
    // Arrange
    const orderData = {
      products: [new mongoose.Types.ObjectId()],
      totalPrice: 50
      // user no está definido a propósito
    };

    // Act & Assert
    const newOrder = new Order(orderData);
    await expect(newOrder.save()).rejects.toThrow();
  });

  it("ORDER-INT-006: Debe rechazar órdenes con totalPrice negativo", async () => {
    // Arrange
    const orderData = {
      products: [new mongoose.Types.ObjectId()],
      user: "testuser_negative",
      totalPrice: -10 // totalPrice negativo a propósito
    };

    // Act & Assert
    const newOrder = new Order(orderData);
    await expect(newOrder.save()).rejects.toThrow();
  });

  it("ORDER-INT-007: Debe actualizar una orden existente", async () => {
    // Arrange: Crear orden inicial
    const initialOrder = new Order({
      products: [new mongoose.Types.ObjectId()],
      user: "testuser_update",
      totalPrice: 100
    });
    await initialOrder.save();

    // Act: Actualizar la orden
    initialOrder.totalPrice = 150;
    initialOrder.products.push(new mongoose.Types.ObjectId());
    await initialOrder.save();

    // Assert
    const updatedOrder = await Order.findOne({ user: "testuser_update" });
    expect(updatedOrder.totalPrice).toBe(150);
    expect(updatedOrder.products).toHaveLength(2);
  });

  it("ORDER-INT-008: Debe eliminar una orden de la base de datos", async () => {
    // Arrange
    const orderData = {
      products: [new mongoose.Types.ObjectId()],
      user: "testuser_delete",
      totalPrice: 75
    };
    const newOrder = new Order(orderData);
    await newOrder.save();

    // Act
    await Order.deleteOne({ user: "testuser_delete" });

    // Assert
    const deletedOrder = await Order.findOne({ user: "testuser_delete" });
    expect(deletedOrder).toBeNull();
  });

  it("ORDER-INT-009: Debe consultar múltiples órdenes del mismo usuario", async () => {
    // Arrange: Crear múltiples órdenes
    const orders = [
      { products: [new mongoose.Types.ObjectId()], user: "testuser_multi", totalPrice: 50 },
      { products: [new mongoose.Types.ObjectId()], user: "testuser_multi", totalPrice: 75 },
      { products: [new mongoose.Types.ObjectId()], user: "testuser_multi", totalPrice: 100 }
    ];

    for (const orderData of orders) {
      const order = new Order(orderData);
      await order.save();
    }

    // Act
    const userOrders = await Order.find({ user: "testuser_multi" });

    // Assert
    expect(userOrders).toHaveLength(3);
    const totalSum = userOrders.reduce((acc, o) => acc + o.totalPrice, 0);
    expect(totalSum).toBe(225);
  });

  describe('Dashboard Stats Integration Tests', () => {
    it('ORDER-INT-010: Dashboard stats should calculate total sales correctly', async () => {
      // Arrange: Create test orders
      const orders = [
        { products: [new mongoose.Types.ObjectId()], user: 'testuser_dashboard1', totalPrice: 100 },
        { products: [new mongoose.Types.ObjectId()], user: 'testuser_dashboard2', totalPrice: 200 },
        { products: [new mongoose.Types.ObjectId()], user: 'testuser_dashboard3', totalPrice: 150 }
      ];

      for (const orderData of orders) {
        const order = new Order(orderData);
        await order.save();
      }

      // Act: Calculate total sales
      const totalSales = await Order.countDocuments();

      // Assert: Should include our test orders plus any existing orders
      expect(totalSales).toBeGreaterThanOrEqual(3);
    });

    it('ORDER-INT-011: Dashboard stats should calculate total revenue correctly', async () => {
      // Arrange: Create test orders with known prices
      const orders = [
        { products: [new mongoose.Types.ObjectId()], user: 'testuser_revenue1', totalPrice: 100 },
        { products: [new mongoose.Types.ObjectId()], user: 'testuser_revenue2', totalPrice: 200 },
        { products: [new mongoose.Types.ObjectId()], user: 'testuser_revenue3', totalPrice: 150 }
      ];

      for (const orderData of orders) {
        const order = new Order(orderData);
        await order.save();
      }

      // Act: Calculate total revenue using aggregation
      const revenueResult = await Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ]);

      const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

      // Assert: Should include our test orders (450) plus any existing revenue
      expect(totalRevenue).toBeGreaterThanOrEqual(450);
    });

    it('ORDER-INT-012: Dashboard stats should calculate recent sales for day period', async () => {
      // Arrange: Create orders with different timestamps
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

      // Recent order (within last 24 hours)
      const recentOrder = new Order({
        products: [new mongoose.Types.ObjectId()],
        user: 'testuser_recent_day',
        totalPrice: 100,
        createdAt: now
      });
      await recentOrder.save();

      // Old order (more than 24 hours ago)
      const oldOrder = new Order({
        products: [new mongoose.Types.ObjectId()],
        user: 'testuser_old_day',
        totalPrice: 200,
        createdAt: twoDaysAgo
      });
      await oldOrder.save();

      // Act: Count orders within last 24 hours
      const recentSales = await Order.countDocuments({
        createdAt: {
          $gte: oneDayAgo,
          $lte: now
        }
      });

      // Assert: Should include at least the recent order
      expect(recentSales).toBeGreaterThanOrEqual(1);
    });

    it('ORDER-INT-013: Dashboard stats should calculate recent sales for week period', async () => {
      // Arrange: Create orders with different timestamps
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Recent order (within last 7 days)
      const recentOrder = new Order({
        products: [new mongoose.Types.ObjectId()],
        user: 'testuser_recent_week',
        totalPrice: 100,
        createdAt: now
      });
      await recentOrder.save();

      // Old order (more than 7 days ago)
      const oldOrder = new Order({
        products: [new mongoose.Types.ObjectId()],
        user: 'testuser_old_week',
        totalPrice: 200,
        createdAt: twoWeeksAgo
      });
      await oldOrder.save();

      // Act: Count orders within last 7 days
      const recentSales = await Order.countDocuments({
        createdAt: {
          $gte: oneWeekAgo,
          $lte: now
        }
      });

      // Assert: Should include at least the recent order
      expect(recentSales).toBeGreaterThanOrEqual(1);
    });

    it('ORDER-INT-014: Dashboard stats should calculate recent sales for month period', async () => {
      // Arrange: Create orders with different timestamps
      const now = new Date();
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twoMonthsAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Recent order (within last 30 days)
      const recentOrder = new Order({
        products: [new mongoose.Types.ObjectId()],
        user: 'testuser_recent_month',
        totalPrice: 100,
        createdAt: now
      });
      await recentOrder.save();

      // Old order (more than 30 days ago)
      const oldOrder = new Order({
        products: [new mongoose.Types.ObjectId()],
        user: 'testuser_old_month',
        totalPrice: 200,
        createdAt: twoMonthsAgo
      });
      await oldOrder.save();

      // Act: Count orders within last 30 days
      const recentSales = await Order.countDocuments({
        createdAt: {
          $gte: oneMonthAgo,
          $lte: now
        }
      });

      // Assert: Should include at least the recent order
      expect(recentSales).toBeGreaterThanOrEqual(1);
    });
  });
});