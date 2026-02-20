import { getEmailAccountsForSync } from "../services/email.service.js";
import { connectRabbit, getChannel } from "../config/rabbit.js";

const runScheduler = async () => {
    await connectRabbit();

    const channel = getChannel();

    const accounts = await getEmailAccountsForSync();

    for (const account of accounts) {
        channel.sendToQueue(
            "email_poll_queue",
            Buffer.from(JSON.stringify(account)),
            { persistent: true }
        );
    }

    console.log("Accounts pushed to queue");
    process.exit(0);
};

runScheduler();