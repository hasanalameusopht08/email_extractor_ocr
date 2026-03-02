import { getChannel, connectRabbitMQ } from "../config/rabbitmq.js";
import axios from "axios";

export const startCallbackWorker = async () => {
    const channel = await connectRabbitMQ();

    channel.consume(
        "callback_queue",
        async (msg) => {
            if (!msg) return;

            const job = JSON.parse(msg.content.toString());
            // console.log(`Callback Worker: Sending result for ${job.file_name}`);

            try {
                await axios.post(job.callback_url, {
                    email: job.email,
                    file_name: job.file_name,
                    ocr_result: job.ocr_result,
                });

                channel.ack(msg);
            } catch (err) {
                console.error("Callback Worker Error:", err.message);

                // If it's a 4xx error (client error), don't retry as it's likely a permanent failure
                if (err.response && err.response.status >= 400 && err.response.status < 500) {
                    console.error(`Status ${err.response.status}: Non-recoverable error for ${job.file_name}. Discarding message.`);
                    channel.ack(msg);
                } else {
                    channel.nack(msg, false, true); // Retry for 5xx or network errors
                }
            }
        },
        { noAck: false }
    );
};