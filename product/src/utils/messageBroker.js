const amqp = require("amqplib");
const config = require("../config");

class MessageBroker {
  constructor() {
    this.channel = null;
    this.isConnected = false;
  }

  async connect() {
    console.log("Connecting to RabbitMQ...");

    setTimeout(async () => {
      try {
        const connection = await amqp.connect(config.rabbitMQUrl || "amqp://rabbitmq:5672");
        this.channel = await connection.createChannel();
        await this.channel.assertQueue(config.queueName || "products");
        await this.channel.assertQueue("orders"); // Ensure orders queue exists
        this.isConnected = true;
        console.log("RabbitMQ connected");
      } catch (err) {
        console.error("Failed to connect to RabbitMQ:", err.message);
        this.isConnected = false;
        // Reintentar conexión después de 5 segundos
        setTimeout(() => this.connect(), 5000);
      }
    }, 10000); // delay to wait for RabbitMQ to start
  }

  isReady() {
    return this.isConnected && this.channel !== null;
  }

  async publishMessage(queue, message) {
    if (!this.channel) {
      console.error("No RabbitMQ channel available.");
      return false;
    }

    try {
      await this.channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(message))
      );
      return true;
    } catch (err) {
      console.error("Error publishing message:", err);
      return false;
    }
  }

  async consumeMessage(queue, callback) {
    if (!this.channel) {
      console.error("No RabbitMQ channel available.");
      return;
    }

    try {
      await this.channel.consume(queue, (message) => {
        const content = message.content.toString();
        const parsedContent = JSON.parse(content);
        callback(parsedContent);
        this.channel.ack(message);
      });
    } catch (err) {
      console.log(err);
    }
  }
}

module.exports = new MessageBroker();
