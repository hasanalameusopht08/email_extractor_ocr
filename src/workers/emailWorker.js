import { getChannel, connectRabbitMQ } from "../config/rabbitmq.js";
import { fetchUnreadEmails } from "../services/email.service.js";

export const startEmailWorker = async () => {
    const channel = await connectRabbitMQ();

    channel.consume(
        "email_fetch_queue",
        async (msg) => {
            if (!msg) return;

            const job = JSON.parse(msg.content.toString());
            console.log(`Email Worker: Processing account ${job.account_id}`);

            try {
                const attachments = await fetchUnreadEmails(job.email_config, job.account_id, 1);

                for (const file of attachments) {
                    const ocrJob = {
                        type: 'OCRJob',
                        account_id: job.account_id,
                        email: job.email_config.user,
                        file_name: file.name,
                        file_data: file.data.toString('base64'),
                        callback_url: job.callback_url,
                    };
                    channel.sendToQueue('ocr_queue', Buffer.from(JSON.stringify(ocrJob)), { persistent: true });
                }

                channel.ack(msg);
            } catch (err) {
                console.error("Email Worker Error:", err);
                channel.nack(msg, false, true); // Retry later
            }
        },
        { noAck: false }
    );
};