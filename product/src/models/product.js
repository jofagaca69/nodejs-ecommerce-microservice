const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  stock: {
    type: Number,
    required: true,
    min: 0
  },
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true
  }]
}, { collection : 'products' });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
