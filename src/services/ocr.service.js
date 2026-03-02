import axios from 'axios';
import FormData from "form-data";
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

        const form = new FormData();
        form.append("file", fileData, { filename: fileName });

        const response = await axios.post(
            process.env.OCR_API_URL || "http://localhost:8000/ocr", // change to your server URL
            form,
            {
                headers: {
                    ...form.getHeaders(),
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 300000, // 5 minutes timeout
            }
        );

        logger.info(`[OCRService] OCR completed for ${response}`);
        return response.data;
    } catch (error) {
        logger.error(`[OCRService] Error processing OCR: ${error.message}`);
        throw error;
    }
};
