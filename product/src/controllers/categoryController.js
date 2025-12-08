const CategoriesService = require("../services/categoriesService");

const categoriesService = new CategoriesService();

/**
 * Class to hold the API implementation for the category services
 */
class CategoryController {
  async createCategory(req, res, next) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const category = await categoriesService.createCategory(req.body);
      return res.status(201).json(category);
    } catch (error) {
      console.error(error);

      if (error.message.includes("required")) {
        return res.status(400).json({ message: error.message });
      }

      return res.status(500).json({ message: "Server error" });
    }
  }

  async getCategories(req, res, next) {
    try {
      const categories = await categoriesService.getCategories();
      return res.status(200).json(categories);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  }

  async deleteTestCategories(req, res, next) {
    try {
      await categoriesService.deleteTestCategories();
      return res.status(200).json({ message: "Test categories deleted" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = CategoryController;
