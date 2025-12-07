const Product = require("../models/product");

/**
 * Class that contains the business logic for the product repository interacting with the product model
 */
class ProductsRepository {
  async create(product) {
    const createdProduct = await Product.create(product);
    return createdProduct.toObject();
  }

  async findById(productId) {
    const product = await Product.findById(productId).lean();
    return product;
  }

  async findAll() {
    const products = await Product.find().lean();
    return products;
  }

  async deleteTestProducts() {
    return await Product.deleteMany({
      name: { $regex: /test/i }  // 'i' para case-insensitive
    });
  }
}

module.exports = ProductsRepository;
