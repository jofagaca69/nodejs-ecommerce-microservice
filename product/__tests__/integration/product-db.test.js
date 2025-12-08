const mongoose = require("mongoose");
const Product = require("../../src/models/product");

// URI para tests locales (puerto 27019 según docker-compose)
const MONGODB_TEST_URI = process.env.MONGODB_PRODUCT_URI || "mongodb://localhost:27019/products";

describe("Product Service <--> MongoDB Integration Tests", () => {
  beforeAll(async () => {
    // Conectar a MongoDB
    await mongoose.connect(MONGODB_TEST_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
  });

  afterEach(async () => {
    // Limpiar productos de prueba después de cada test
    await Product.deleteMany({ name: /^testproduct/ });
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  it("PROD-INT-001: Debe crear y persistir un producto en MongoDB", async () => {
    // Arrange: Preparar datos de producto
    const productData = {
      name: "testproduct_laptop",
      price: 1299.99,
      description: "High-performance gaming laptop"
    };

    // Act: Crear y guardar el producto directamente
    const newProduct = new Product(productData);
    await newProduct.save();

    // Assert: Verificar que el producto existe en MongoDB
    const productInDb = await Product.findOne({ name: productData.name });
    
    expect(productInDb).not.toBeNull();
    expect(productInDb.name).toBe(productData.name);
    expect(productInDb.price).toBe(productData.price);
    expect(productInDb.description).toBe(productData.description);
  });

  it("PROD-INT-002: Debe validar el esquema correcto en MongoDB", async () => {
    // Arrange
    const productData = {
      name: "testproduct_keyboard",
      price: 89.99,
      description: "Mechanical keyboard"
    };

    // Act
    const newProduct = new Product(productData);
    await newProduct.save();

    // Assert
    const product = await Product.findOne({ name: productData.name }).lean();
    
    expect(product).toHaveProperty("_id");
    expect(product).toHaveProperty("name");
    expect(product).toHaveProperty("price");
    expect(product).toHaveProperty("description");
    expect(typeof product.name).toBe("string");
    expect(typeof product.price).toBe("number");
    expect(typeof product.description).toBe("string");
  });

  it("PROD-INT-003: Debe rechazar productos sin campo name requerido", async () => {
    // Arrange
    const productData = {
      price: 50.00,
      description: "Product without name"
      // name no está definido a propósito
    };

    // Act & Assert
    const newProduct = new Product(productData);
    await expect(newProduct.save()).rejects.toThrow();
  });

  it("PROD-INT-004: Debe rechazar productos sin campo price requerido", async () => {
    // Arrange
    const productData = {
      name: "testproduct_no_price",
      description: "Product without price"
      // price no está definido a propósito
    };

    // Act & Assert
    const newProduct = new Product(productData);
    await expect(newProduct.save()).rejects.toThrow();
  });

  it("PROD-INT-005: Debe manejar productos sin description (campo opcional)", async () => {
    // Arrange
    const productData = {
      name: "testproduct_no_desc",
      price: 25.99
      // description no está definido (es opcional)
    };

    // Act
    const newProduct = new Product(productData);
    await newProduct.save();

    // Assert
    const product = await Product.findOne({ name: productData.name });
    
    expect(product).not.toBeNull();
    expect(product.name).toBe(productData.name);
    expect(product.price).toBe(productData.price);
    expect(product.description).toBeUndefined();
  });

  it("PROD-INT-006: Debe actualizar un producto existente", async () => {
    // Arrange: Crear producto inicial
    const initialProduct = new Product({
      name: "testproduct_update",
      price: 100.00,
      description: "Initial description"
    });
    await initialProduct.save();

    // Act: Actualizar el producto
    initialProduct.price = 150.00;
    initialProduct.description = "Updated description";
    await initialProduct.save();

    // Assert
    const updatedProduct = await Product.findOne({ name: "testproduct_update" });
    expect(updatedProduct.price).toBe(150.00);
    expect(updatedProduct.description).toBe("Updated description");
  });

  it("PROD-INT-007: Debe eliminar un producto de la base de datos", async () => {
    // Arrange
    const productData = {
      name: "testproduct_delete",
      price: 75.50,
      description: "Product to be deleted"
    };
    const newProduct = new Product(productData);
    await newProduct.save();

    // Act
    await Product.deleteOne({ name: "testproduct_delete" });

    // Assert
    const deletedProduct = await Product.findOne({ name: "testproduct_delete" });
    expect(deletedProduct).toBeNull();
  });

  it("PROD-INT-008: Debe consultar múltiples productos", async () => {
    // Arrange: Crear múltiples productos
    const products = [
      { name: "testproduct_multi_1", price: 50.00, description: "Product 1" },
      { name: "testproduct_multi_2", price: 75.00, description: "Product 2" },
      { name: "testproduct_multi_3", price: 100.00, description: "Product 3" }
    ];

    for (const productData of products) {
      const product = new Product(productData);
      await product.save();
    }

    // Act
    const allProducts = await Product.find({ name: /^testproduct_multi/ });

    // Assert
    expect(allProducts).toHaveLength(3);
    const totalPrice = allProducts.reduce((acc, p) => acc + p.price, 0);
    expect(totalPrice).toBe(225.00);
  });

  it("PROD-INT-009: Debe buscar un producto por ID", async () => {
    // Arrange
    const productData = {
      name: "testproduct_findbyid",
      price: 199.99,
      description: "Product to find by ID"
    };
    const newProduct = new Product(productData);
    await newProduct.save();
    const productId = newProduct._id;

    // Act
    const foundProduct = await Product.findById(productId);

    // Assert
    expect(foundProduct).not.toBeNull();
    expect(foundProduct._id.toString()).toBe(productId.toString());
    expect(foundProduct.name).toBe(productData.name);
    expect(foundProduct.price).toBe(productData.price);
  });
});

