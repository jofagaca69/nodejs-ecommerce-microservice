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
});