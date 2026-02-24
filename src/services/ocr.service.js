import logger from '../utils/logger.js';

/**
 * Simulate OCR processing
 * @param {string} fileName 
 * @param {Buffer} fileData 
 * @returns {Promise<Object>}
 */
export const processOCR = async (fileName, fileData) => {
    try {
        logger.info(`[OCRService] Starting OCR for ${fileName}...`);

        // Simulate long processing time (the user mentioned 120+ seconds)
        // For testing purposes, we might not want to wait 2 minutes, 
        // but let's simulate a reasonable delay or use a real API if available.
        // Since no API is provided, we simulate success after a delay.

        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds for simulation

        logger.info(`[OCRService] OCR completed for ${fileName}`);

        return {
            status: 'success',
            extracted_data: {
                invoice_number: 'INV-' + Math.floor(Math.random() * 10000),
                total_amount: (Math.random() * 500).toFixed(2),
                currency: 'USD',
                date: new Date().toISOString().split('T')[0],
            },
            processed_at: new Date().toISOString()
        };
    } catch (error) {
        logger.error(`[OCRService] Error processing OCR: ${error.message}`);
        throw error;
    }
};
