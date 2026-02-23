const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function togifCommand(sock, chatId, message) {
    const fakeContact = createFakeContact(message);
    const botName = getBotName();
    
    const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg) {
        return sock.sendMessage(chatId, { text: `*${botName}*\nReply to a video or animated sticker with .togif` }, { quoted: fakeContact });
    }
    
    const isVideo = quotedMsg.videoMessage;
    const isSticker = quotedMsg.stickerMessage;
    
    if (!isVideo && !isSticker) {
        return sock.sendMessage(chatId, { text: `*${botName}*\nReply to a video or animated sticker only.` }, { quoted: fakeContact });
    }
    
    await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });
    
    try {
        const buffer = await downloadMediaMessage({ message: quotedMsg }, 'buffer', {});
        if (buffer) {
            await sock.sendMessage(chatId, { video: buffer, gifPlayback: true, caption: `*${botName}*\nConverted to GIF` }, { quoted: fakeContact });
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        }
    } catch (err) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nConversion failed: ${err.message}` }, { quoted: fakeContact });
    }
}

module.exports = { togifCommand };
