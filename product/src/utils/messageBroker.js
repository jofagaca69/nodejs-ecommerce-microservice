const amqp = require("amqplib");
const config = require("../config");

class MessageBroker {
  constructor() {
    this.channel = null;
    this.isConnected = false;
    this.consumerRegistered = false;
    this.orderCallbacks = new Map(); // Map to store callbacks by orderId
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
        
        // Setup the products consumer once connected
        await this.setupProductsConsumer();
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

  /**
   * Register a callback for a specific orderId
   * This allows multiple orders to be processed concurrently
   */
  registerOrderCallback(orderId, callback) {
    this.orderCallbacks.set(orderId, callback);
    console.log(`[Order ${orderId}] Callback registered. Total callbacks: ${this.orderCallbacks.size}`);
  }

  /**
   * Remove a callback for a specific orderId
   */
  removeOrderCallback(orderId) {
    this.orderCallbacks.delete(orderId);
    console.log(`[Order ${orderId}] Callback removed. Total callbacks: ${this.orderCallbacks.size}`);
  }

  /**
   * Setup the consumer once for the products queue
   * This should be called only once when the service starts
   * It's safe to call multiple times - it will only register once
   */
  async setupProductsConsumer() {
    if (this.consumerRegistered) {
      console.log("Products consumer already registered");
      return;
    }

    if (!this.channel) {
      console.warn("No RabbitMQ channel available for consumer setup. Will retry when channel is ready.");
      // Retry after a short delay if channel is not ready yet
      setTimeout(() => {
        if (this.channel && !this.consumerRegistered) {
          this.setupProductsConsumer();
        }
      }, 1000);
      return;
    }

    try {
      await this.channel.consume(config.queueName || "products", (message) => {
        try {
          const content = message.content.toString();
          const parsedContent = JSON.parse(content);
          const { orderId } = parsedContent;

          if (!orderId) {
            console.error("Received message without orderId, ignoring");
            this.channel.ack(message);
            return;
          }

          // Find the callback for this orderId
          const callback = this.orderCallbacks.get(orderId);
          if (callback) {
            console.log(`[Order ${orderId}] Found callback, processing message`);
            callback(parsedContent);
            // Remove callback after processing
            this.removeOrderCallback(orderId);
          } else {
            console.warn(`[Order ${orderId}] No callback found for orderId, message will be lost`);
          }

          this.channel.ack(message);
        } catch (err) {
          console.error("Error processing message in consumer:", err);
          this.channel.ack(message); // ACK to avoid reprocessing
        }
      });

      this.consumerRegistered = true;
      console.log("Products consumer registered successfully");
    } catch (err) {
      console.error("Error setting up products consumer:", err);
      // Reset flag to allow retry
      this.consumerRegistered = false;
    }
  }

  /**
   * @deprecated Use registerOrderCallback and setupProductsConsumer instead
   * This method is kept for backward compatibility but should not be used
   */
  async consumeMessage(queue, callback) {
    console.warn("consumeMessage is deprecated. Use registerOrderCallback and setupProductsConsumer instead.");
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
