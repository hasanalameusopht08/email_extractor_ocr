import amqp from "amqplib";

let channel;

export const connectRabbit = async () => {
    const connection = await amqp.connect("amqp://localhost");
    channel = await connection.createChannel();

    await channel.assertQueue("email_poll_queue", { durable: true });

    console.log("RabbitMQ connected");
};

export const getChannel = () => channel;