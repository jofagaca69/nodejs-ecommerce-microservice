const express = require("express");
const CategoryController = require("../controllers/categoryController");
const isAuthenticated = require("../utils/isAuthenticated");

const router = express.Router();
const categoryController = new CategoryController();

router.post("/", isAuthenticated, categoryController.createCategory.bind(categoryController));
router.get("/", isAuthenticated, categoryController.getCategories.bind(categoryController));
router.delete("/test-categories", categoryController.deleteTestCategories.bind(categoryController));


module.exports = router;
