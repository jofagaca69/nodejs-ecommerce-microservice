const CategoriesRepository = require("../repositories/categoriesRepository");

/**
 * Class that ties together the business logic and the data access layer
 */
class CategoriesService {
  constructor() {
    this.categoriesRepository = new CategoriesRepository();
  }

  async createCategory(category) {
    const createdCategory = await this.categoriesRepository.create(category);
    return createdCategory;
  }

  async getCategoryById(categoryId) {
    const category = await this.categoriesRepository.findById(categoryId);
    return category;
  }

  async getCategories() {
    const categories = await this.categoriesRepository.findAll();
    return categories;
  }

  async deleteTestCategories() {
    await this.categoriesRepository.deleteMany();
  }
}

module.exports = CategoriesService;
