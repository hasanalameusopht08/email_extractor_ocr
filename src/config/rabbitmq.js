import amqp from "amqplib";

let connection;
let channel;

export const connectRabbitMQ = async () => {
    if (connection && channel) return channel;

    try {
        const url = process.env.RABBITMQ_URL || "amqp://localhost";
        // Add heartbeat to prevent connection drops during long tasks
        connection = await amqp.connect(`${url}?heartbeat=60`);
        channel = await connection.createChannel();

        await channel.assertQueue("email_fetch_queue", { durable: true });
        await channel.assertQueue("ocr_queue", { durable: true });
        await channel.assertQueue("callback_queue", { durable: true });

        // Fair dispatch: don't give more than 1 message to a worker at a time
        // This is crucial for OCR jobs that take 120+ seconds.
        await channel.prefetch(1);

        console.log("RabbitMQ connected and queues asserted.");
        return channel;
    } catch (err) {
        console.error("RabbitMQ connection failed:", err);
        process.exit(1);
    }
};

export const getChannel = () => channel;
export const getRabbitMQConnection = () => connection;