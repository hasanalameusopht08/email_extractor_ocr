import { connectRabbitMQ } from "../config/rabbitmq.js";
import { processOCR } from "../services/ocr.service.js";

export const startOCRWorker = async () => {
    const channel = await connectRabbitMQ();
    // This is crucial for OCR jobs that take 120+ seconds.
    await channel.prefetch(1);
    channel.consume(
        "ocr_queue",
        async (msg) => {
            if (!msg) return;

            const job = JSON.parse(msg.content.toString());
            console.log(`OCR Worker: Processing file ${job.file_name}`);

            try {
                let fileBuffer = Buffer.from(job.file_data, 'base64');

                // If the buffer was serialized as a JSON object {type: 'Buffer', data: [...]}
                if (fileBuffer && typeof fileBuffer === 'object' && fileBuffer.type === 'Buffer') {
                    fileBuffer = Buffer.from(fileBuffer.data);
                } else if (typeof fileBuffer === 'string') {
                    // If it was base64 encoded or something similar
                    fileBuffer = Buffer.from(fileBuffer, 'base64');
                }

                const ocrResult = await processOCR(job.file_name, fileBuffer);

                // Push to callback queue
                const callbackJob = {
                    account_id: job.account_id,
                    email: job.email,
                    file_name: job.file_name,
                    ocr_result: ocrResult,
                    callback_url: job.callback_url,
                };

                channel.sendToQueue(
                    "callback_queue",
                    Buffer.from(JSON.stringify(callbackJob)),
                    { persistent: true }
                );

                channel.ack(msg);
            } catch (err) {
                console.error("OCR Worker Error:", err);
                channel.nack(msg, false, true);
            }
        },
        { noAck: false }
    );
};