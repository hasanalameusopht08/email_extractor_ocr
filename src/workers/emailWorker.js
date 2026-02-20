import { connectRabbit, getChannel } from "../config/rabbit.js";
import { fetchEmailsForAccount } from "../yourExistingFile.js";

const startWorker = async () => {
    await connectRabbit();
    const channel = getChannel();

    channel.prefetch(1); // important: 1 account at a time

    channel.consume("email_poll_queue", async (msg) => {
        if (!msg) return;

        const account = JSON.parse(msg.content.toString());

        try {
            await fetchEmailsForAccount({
                userId: account.account_id,
                host: account.host,
                port: parseInt(account.port, 10) || 993,
                user: account.user,
                pass: account.password
            });

            channel.ack(msg);

        } catch (error) {
            console.error("Worker error:", error);
            channel.nack(msg, false, true); // requeue if failed
        }
    });

    console.log("Email Worker started...");
};

startWorker();