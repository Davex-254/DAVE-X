const fs = require('fs');
const fsPromises = require('fs/promises');
const fse = require('fs-extra');
const path = require('path');
const webp = require('webp-converter');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

const tempDir = './temp';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

/**
 * Schedule deletion of a file after a delay
 * @param {string} filePath - Path of the file to delete
 * @param {number} delay - Delay in ms before deletion
 */
const scheduleFileDeletion = (filePath, delay = 10000) => {
    setTimeout(async () => {
        try {
            await fse.remove(filePath);
            console.log(`✅ Deleted: ${filePath}`);
        } catch (error) {
            console.error(`❌ Failed to delete ${filePath}:`, error);
        }
    }, delay);
};

/**
 * Convert a WhatsApp sticker (WEBP) to PNG and send it back
 * @param {object} sock - Baileys socket instance
 * @param {object} quotedMessage - Quoted message containing sticker
 * @param {string} chatId - Chat ID to send the converted image
 */
const convertStickerToImage = async (sock, quotedMessage, chatId) => {
    try {
        const stickerMessage = quotedMessage?.stickerMessage;
        if (!stickerMessage) {
            await sock.sendMessage(chatId, { text: '⚠️ Reply to a sticker with .simage to convert it.' });
            return;
        }

        const timestamp = Date.now();
        const stickerFilePath = path.join(tempDir, `sticker_${timestamp}.webp`);
        const outputImagePath = path.join(tempDir, `converted_${timestamp}.png`);

        // Download sticker
        const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await fsPromises.writeFile(stickerFilePath, buffer);

        // Convert WEBP → PNG
        const result = await webp.dwebp(stickerFilePath, outputImagePath, "-o");
        console.log("WEBP → PNG conversion result:", result);

        // Read and send converted image
        const imageBuffer = await fsPromises.readFile(outputImagePath);
        await sock.sendMessage(chatId, { 
            image: imageBuffer, 
            caption: '✅ Sticker converted to image!' 
        });

        // Cleanup
        scheduleFileDeletion(stickerFilePath);
        scheduleFileDeletion(outputImagePath);

    } catch (error) {
        console.error('❌ Error converting sticker:', error);
        await sock.sendMessage(chatId, { text: 'An error occurred while converting the sticker.' });
    }
};

module.exports = convertStickerToImage;
