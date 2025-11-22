require('dotenv').config();

module.exports = {
    mongoURI: process.env.MONGODB_ORDER_URI || 'mongodb://mongodb-order:27017/orders',
    rabbitMQUrl: process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672',
    rabbitMQQueue: process.env.RABBITMQ_QUEUE || 'orders',
    port: process.env.PORT || 3002
};
  