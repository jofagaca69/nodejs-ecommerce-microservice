const Category = require("../models/category");

/**
 * Class that contains the business logic for the product repository interacting with the product model
 */
class CategoriesRepository {
  async create(category) {
    const createdCategory = await Category.create(category);
    return createdCategory.toObject();
  }

  async deleteMany() {
    await Category.deleteMany({ name: /^test/ });
  }
  
  async findById(categoryId) {
    const category = await Category.findById(categoryId).lean();
    return category;
  }

  async findAll() {
    const categories = await Category.find().lean();
    return categories;
  }
}

module.exports = CategoriesRepository;
