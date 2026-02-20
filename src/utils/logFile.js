import fs from 'fs-extra';
import path from 'path';
import logger from './logger.js';

const LOG_BASE_DIR = path.join(process.cwd(), 'logs');

export const createLogFile = (taskName = 'worker') => {
    try {
        fs.ensureDirSync(LOG_BASE_DIR);

        const dateStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const folderPath = path.join(LOG_BASE_DIR, dateStr);
        fs.ensureDirSync(folderPath);

        const timestamp = new Date().getTime();
        const fileName = `${taskName.toLowerCase().replace(/\s+/g, '_')}_${timestamp}.log`;
        const filePath = path.join(folderPath, fileName);

        // Ensure file exists
        fs.ensureFileSync(filePath);

        return filePath;
    } catch (error) {
        logger.error(`Failed to create log file: ${error.message}`);
        throw new Error('Log system initialization failed');
    }
};
export const addLog = async (filePath, message, data = null, level = 'INFO') => {
    try {
        const timestamp = new Date().toISOString();
        const statusIcon =
            level === 'ERROR' ? '❌' :
                level === 'WARN' ? '⚠️' :
                    level === 'DEBUG' ? '🐞' :
                        '➡️';

        let entry = `\n${'='.repeat(70)}\n`;
        entry += `[${timestamp}] [${level.toUpperCase()}] ${statusIcon} ${message}\n`;

        if (data) {
            if (data instanceof AggregateError) {
                entry += `Error Type: AggregateError\n`;
                entry += `Error Count: ${data.errors?.length || 0}\n`;

                data.errors?.forEach((err, index) => {
                    entry += `\n  ↳ Sub Error ${index + 1}:\n`;
                    entry += `     Message: ${err.message}\n`;
                    entry += `     Code: ${err.code || 'N/A'}\n`;
                    entry += `     Stack: ${err.stack}\n`;
                });

            } else if (data instanceof Error) {
                entry += `Error Type: ${data.name}\n`;
                entry += `Message: ${data.message || 'No message provided'}\n`;
                entry += `Code: ${data.code || 'N/A'}\n`;
                entry += `Stack:\n${data.stack}\n`;

            } else {
                entry += `Metadata:\n${JSON.stringify(data, null, 2)}\n`;
            }
        }

        entry += `${'='.repeat(70)}\n`;

        await fs.appendFile(filePath, entry, 'utf8');

    } catch (error) {
        logger.error(`Critical: Could not write to log file ${filePath}. ${error.message}`);
    }
};
