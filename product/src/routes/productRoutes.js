const express = require("express");
const ProductController = require("../controllers/productController");
const isAuthenticated = require("../utils/isAuthenticated");

const router = express.Router();
const productController = new ProductController();

router.post("/", isAuthenticated, productController.createProduct);
router.post("/buy", isAuthenticated, productController.createOrder);
router.get("/", productController.getProducts);
router.delete("/test-products", productController.deleteTestProducts);

// Rutas de inventario
router.get("/inventory/stats", productController.getInventoryStats);
router.get("/inventory/low-stock", productController.getLowStockProducts);
router.patch("/:id/stock", productController.updateProductStock);

module.exports = router;
