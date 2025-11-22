/**
 * Fake Products Repository
 * 
 * Implementa la misma interfaz que ProductsRepository usando un array en memoria
 * en lugar de MongoDB. Es un "fake" porque implementa funcionalidad real simplificada.
 */
class FakeProductsRepository {
  constructor() {
    this.products = [];
    this.nextId = 1;
  }

  /**
   * Crea un nuevo producto en memoria
   * @param {Object} product - Objeto con name, description, price
   * @returns {Promise<Object>} Producto creado con _id generado
   */
  async create(product) {
    const newProduct = {
      _id: `fake-${this.nextId++}`,
      name: product.name,
      description: product.description,
      price: product.price
    };
    this.products.push(newProduct);
    return newProduct;
  }

  /**
   * Busca un producto por su ID
   * @param {string} productId - ID del producto
   * @returns {Promise<Object|null>} Producto encontrado o null
   */
  async findById(productId) {
    const product = this.products.find(p => p._id === productId);
    return product || null;
  }

  /**
   * Obtiene todos los productos
   * @returns {Promise<Array>} Array con todos los productos
   */
  async findAll() {
    return [...this.products]; // Retorna copia para evitar mutaciones
  }

  /**
   * Limpia el almacenamiento (útil para tests)
   */
  clear() {
    this.products = [];
    this.nextId = 1;
  }
}

module.exports = FakeProductsRepository;

