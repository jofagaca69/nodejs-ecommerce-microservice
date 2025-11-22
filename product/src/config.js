require("dotenv").config();

module.exports = {
  port: process.env.PORT || 3001,
  mongoURI: process.env.MONGODB_PRODUCT_URI || "mongodb://mongodb-product:27017/products",
  rabbitMQUrl: process.env.RABBITMQ_URL || "amqp://rabbitmq:5672",
  exchangeName: process.env.EXCHANGE_NAME || "products",
  queueName: process.env.QUEUE_NAME || "products_queue",
};
