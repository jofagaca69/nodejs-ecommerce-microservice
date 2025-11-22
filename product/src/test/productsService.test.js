/**
 * Unit Tests para ProductsService
 * 
 * Estrategia: Usamos jest.mock() para reemplazar ProductsRepository con FakeProductsRepository
 * El fake usa un array en memoria en lugar de MongoDB.
 */

jest.mock('../repositories/productsRepository', () => {
  const FakeProductsRepository = require('./fakes/FakeProductsRepository');
  return FakeProductsRepository;
});

const ProductsService = require('../services/productsService');

describe('ProductsService', () => {
  let service;
  let fakeRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductsService();
    fakeRepository = service.productsRepository;
    fakeRepository.clear();
  });

  /**
   * Tests para el método createProduct
   */
  describe('createProduct', () => {
    it('should create a product successfully', async () => {
      // Arrange: Preparamos los datos de entrada
      const productData = {
        name: 'Laptop Gaming',
        description: 'High-performance gaming laptop',
        price: 1299.99
      };

      // Act: Ejecutamos el método a testear
      const result = await service.createProduct(productData);

      // Assert: Verificamos el resultado esperado
      expect(result).toBeDefined();
      expect(result).toHaveProperty('_id');
      expect(result.name).toBe(productData.name);
      expect(result.description).toBe(productData.description);
      expect(result.price).toBe(productData.price);
      expect(result._id).toMatch(/^fake-\d+$/);
    });

    it('should persist the product and allow retrieval', async () => {
      const productData = {
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse',
        price: 29.99
      };

      const createdProduct = await service.createProduct(productData);
      const retrievedProduct = await service.getProductById(createdProduct._id);

      expect(retrievedProduct).not.toBeNull();
      expect(retrievedProduct.name).toBe(productData.name);
      expect(retrievedProduct.price).toBe(productData.price);
    });
  });

  /**
   * Tests para el método getProductById
   */
  describe('getProductById', () => {
    it('should return a product when it exists', async () => {
      // Arrange: Creamos un producto para luego buscarlo
      const productData = {
        name: 'Keyboard',
        description: 'Mechanical keyboard',
        price: 89.99
      };
      const createdProduct = await service.createProduct(productData);
      const productId = createdProduct._id;

      // Act: Buscamos el producto por ID
      const result = await service.getProductById(productId);

      // Assert: Verificamos que se encontró correctamente
      expect(result).not.toBeNull();
      expect(result._id).toBe(productId);
      expect(result.name).toBe(productData.name);
    });

    it('should return null when product does not exist', async () => {
      // Arrange: Preparamos un ID que no existe
      const nonExistentId = 'fake-999';

      // Act: Intentamos buscar el producto
      const result = await service.getProductById(nonExistentId);

      // Assert: Verificamos que retorna null
      expect(result).toBeNull();
    });
  });

  /**
   * Tests para el método getProducts
   */
  describe('getProducts', () => {
    it('should return all products when they exist', async () => {
      await service.createProduct({
        name: 'Product 1',
        description: 'Description 1',
        price: 10.00
      });
      await service.createProduct({
        name: 'Product 2',
        description: 'Description 2',
        price: 20.00
      });
      await service.createProduct({
        name: 'Product 3',
        description: 'Description 3',
        price: 30.00
      });

      const result = await service.getProducts();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(3);
      expect(result).toContainEqual(expect.objectContaining({ name: 'Product 1' }));
      expect(result).toContainEqual(expect.objectContaining({ name: 'Product 2' }));
      expect(result).toContainEqual(expect.objectContaining({ name: 'Product 3' }));
    });

    it('should return empty array when no products exist', async () => {
      const result = await service.getProducts();

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(0);
      expect(result).toEqual([]);
    });
  });
});

