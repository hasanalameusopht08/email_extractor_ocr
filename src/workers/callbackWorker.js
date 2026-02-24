import { getChannel, connectRabbitMQ } from "../config/rabbitmq.js";
import axios from "axios";

export const startCallbackWorker = async () => {
    const channel = await connectRabbitMQ();

    channel.consume(
        "callback_queue",
        async (msg) => {
            if (!msg) return;

            const job = JSON.parse(msg.content.toString());
            console.log(`Callback Worker: Sending result for ${job.file_name}`);

            try {
                await axios.post(job.callback_url, {
                    email: job.account_id,
                    file_name: job.file_name,
                    ocr_result: job.ocr_result,
                });

                channel.ack(msg);
            } catch (err) {
                console.error("Callback Worker Error:", err.message);
                channel.nack(msg, false, true); // Retry
            }
        },
        { noAck: false }
    );
};