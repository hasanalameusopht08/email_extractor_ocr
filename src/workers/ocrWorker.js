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
            // console.log(`OCR Worker: Processing file ${job.file_name}`);

            try {
                const fileBuffer = Buffer.from(job.file_data, 'base64');

                const ocrResult = await processOCR(job.file_name, fileBuffer);

                // Push to callback queue
                const callbackJob = {
                    account_id: job.account_id,
                    email: job.email,
                    file_name: job.file_name,
                    ocr_result: ocrResult,
                    callback_url: job.callback_url,
                };
                // console.log("results", callbackJob);

                channel.sendToQueue(
                    "callback_queue",
                    Buffer.from(JSON.stringify(callbackJob)),
                    { persistent: true }
                );

                channel.ack(msg);
            } catch (err) {
                console.error("OCR Worker Error:", err);
                channel.nack(msg, false, false); // do NOT requeue
            }
        },
        { noAck: false }
    );
};