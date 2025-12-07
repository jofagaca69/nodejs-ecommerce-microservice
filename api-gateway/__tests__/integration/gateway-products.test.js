const axios = require("axios");

const gatewayUrl = process.env.GATEWAY_URL || "http://localhost:3003";

describe("Gateway <--> Product microservice integration", () => {
  let authToken;
  let testProductIds = [];
  let testCategoryId;

  beforeAll(async () => {
    const user = {
      username: "testuser_products",
      password: "password123"
    };

    try {
      await axios.post(`${gatewayUrl}/auth/register`, user);
    } catch (error) {
      // Usuario ya existe
    }

    const loginResponse = await axios.post(`${gatewayUrl}/auth/login`, user);
    authToken = loginResponse.data.token;

    const categoryResponse = await axios.post(
      `${gatewayUrl}/products/api/categories`,
      { name: `testcategory_${Date.now()}`, description: "test" },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    testCategoryId = categoryResponse.data._id;
  });

  afterEach(async () => {
    testProductIds = [];
  });

  afterAll(async () => {
    try {
      await axios.post(`${gatewayUrl}/auth/delete-test-users`);
    } catch (error) {
      // Ignorar errores de limpieza
    }
    try {
      await axios.delete(`${gatewayUrl}/products/api/categories/test-categories`);
    } catch (error) {
      // Ignorar errores de limpieza
    }
    try {
      await axios.delete(`${gatewayUrl}/products/api/products/test-products`);
    } catch (error) {
      // Ignorar errores de limpieza
    }
  });

  it("PROD-INT-001: Debe crear un producto exitosamente con todos los campos", async () => {
    const product = {
      name: "Laptop Test",
      description: "Laptop de prueba para testing",
      price: 1299.99,
      stock: 10,
      categories: [testCategoryId]
    };

    const response = await axios.post(
      `${gatewayUrl}/products/api/products`,
      product,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty("_id");
    expect(response.data.name).toBe(product.name);
    expect(response.data.description).toBe(product.description);
    expect(response.data.price).toBe(product.price);
    expect(response.data.stock).toBe(product.stock);
    expect(response.data.categories).toStrictEqual(product.categories);

    testProductIds.push(response.data._id);
  });

  it("PROD-INT-002: Debe rechazar creación de producto sin token de autenticación", async () => {
    const product = {
      name: "Producto Sin Auth",
      description: "Este debe fallar",
      price: 99.99,
      stock: 10,
      categories: [testCategoryId]
    };

    const err = await axios
      .post(`${gatewayUrl}/products/api/products`, product)
      .catch(e => e);

    expect(err.response.status).toBe(401);
    expect(err.response.data).toHaveProperty("message");
  });

  it("PROD-INT-003: Debe listar todos los productos con autenticación válida", async () => {
    const product = {
      name: "Producto para Listar",
      description: "Test",
      price: 50.00,
      stock: 10,
      categories: [testCategoryId]
    };

    await axios.post(
      `${gatewayUrl}/products/api/products`,
      product,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    const response = await axios.get(
      `${gatewayUrl}/products/api/products`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    expect(response.status).toBe(200);
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data.length).toBeGreaterThan(0);

    const firstProduct = response.data[0];
    console.log(response.data)
    expect(firstProduct).toHaveProperty("_id");
    expect(firstProduct).toHaveProperty("name");
    expect(firstProduct).toHaveProperty("price");
    expect(firstProduct).toHaveProperty("description");
    expect(firstProduct).toHaveProperty("stock");
    expect(firstProduct).toHaveProperty("categories");
  });

  it("PROD-INT-004: Debe rechazar listado de productos sin token de autenticación", async () => {
    const err = await axios
      .get(`${gatewayUrl}/products/api/products`)
      .catch(e => e);

    expect(err.response.status).toBe(401);
    expect(err.response.data).toHaveProperty("message", "Unauthorized");
  });

  it("PROD-INT-005: Debe rechazar producto sin campos requeridos", async () => {
    const invalidProduct = {
      name: "Producto Incompleto"
    };

    const err = await axios
      .post(
        `${gatewayUrl}/products/api/products`,
        invalidProduct,
        { headers: { Authorization: `Bearer ${authToken}` } }
      )
      .catch(e => e);

    expect(err.response.status).toBe(400);
    expect(err.response.data).toHaveProperty("message");
  });

  it("PROD-INT-006: Debe crear múltiples productos secuencialmente", async () => {
    const products = [
      { name: "Mouse", description: "Mouse inalámbrico", price: 25.00, stock: 10, categories: [testCategoryId] },
      { name: "Teclado", description: "Teclado mecánico", price: 75.00, stock: 10, categories: [testCategoryId] },
      { name: "Monitor", description: "Monitor 24 pulgadas", price: 200.00, stock: 10, categories: [testCategoryId] }
    ];

    for (const product of products) {
      const response = await axios.post(
        `${gatewayUrl}/products/api/products`,
        product,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty("_id");
      expect(response.data.name).toBe(product.name);
      expect(response.data.price).toBe(product.price);

      testProductIds.push(response.data._id);
    }

    expect(testProductIds.length).toBe(3);
  });

  it("PROD-INT-007: Debe retornar la estructura correcta al crear producto", async () => {
    const product = {
      name: "Producto Verificación",
      description: "Test de estructura de respuesta",
      price: 45.00,
      stock: 10,
      categories: [testCategoryId]
    };

    const response = await axios.post(
      `${gatewayUrl}/products/api/products`,
      product,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty("_id");
    expect(response.data).toHaveProperty("name", product.name);
    expect(response.data).toHaveProperty("description", product.description);
    expect(response.data).toHaveProperty("price", product.price);
    expect(response.data).toHaveProperty("stock", product.stock);
    expect(response.data).toHaveProperty("categories", product.categories);
    expect(typeof response.data._id).toBe("string");
    expect(response.data._id.length).toBeGreaterThan(0);
  });

});
