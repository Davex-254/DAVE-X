const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

async function tomp4Command(sock, chatId, message) {
    const fakeContact = createFakeContact(message);
    const botName = getBotName();
    
    const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) {
        return sock.sendMessage(chatId, { text: `*${botName}*\nReply to a sticker or GIF with .tomp4` }, { quoted: fakeContact });
    }
    
    const isStickerOrGif = quotedMsg.stickerMessage || (quotedMsg.videoMessage && quotedMsg.videoMessage.gifPlayback) || quotedMsg.imageMessage?.mimetype?.includes('webp');
    
    if (!isStickerOrGif) {
        return sock.sendMessage(chatId, { text: `*${botName}*\nReply to an animated sticker or GIF only.` }, { quoted: fakeContact });
    }
    
    await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });
    
    try {
        const buffer = await downloadMediaMessage({ message: quotedMsg }, 'buffer', {});
        if (buffer) {
            await sock.sendMessage(chatId, { video: buffer, gifPlayback: false, caption: `*${botName}*\nConverted to MP4` }, { quoted: fakeContact });
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        }
    } catch (err) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nConversion failed: ${err.message}` }, { quoted: fakeContact });
    }
}

module.exports = { tomp4Command };
