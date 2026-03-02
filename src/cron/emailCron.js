import cron from "node-cron";
import { connectRabbitMQ } from "../config/rabbitmq.js";
import { getEmailAccountsForSync } from "../services/email.service.js";

export const startEmailCron = async () => {
    const channel = await connectRabbitMQ();

    const interval = process.env.POLL_INTERVAL_MINUTES || 30;

    // Schedule based on interval from .env
    cron.schedule(`*/${interval} * * * *`, async () => {
        console.log("Cron job started: Fetch ACTIVE email accounts...");

        const accounts = await getEmailAccountsForSync(); // from DB
        // console.log("accounts", accounts.length);

        for (const account of accounts) {
            const job = {
                type: "EmailFetchJob",
                account_id: account.account_id,
                email_config: {
                    host: account.host,
                    port: account.port,
                    user: account.user,
                    password: account.password,
                    tls: account.tls,
                    ssl: account.ssl,
                },
                callback_url: account.callback_url,
            };
            // console.log("Sending job for account:", account.user);

            channel.sendToQueue(
                "email_fetch_queue",
                Buffer.from(JSON.stringify(job)),
                { persistent: true }
            );
        }

        // console.log(`Cron job finished: ${accounts.length} jobs pushed to email_fetch_queue`);
    });
};