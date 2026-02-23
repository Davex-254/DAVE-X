const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');

async function toimgCommand(sock, chatId, message) {
    const fakeContact = createFakeContact(message);
    const botName = getBotName();
    
    const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quotedMsg?.stickerMessage) {
        return sock.sendMessage(chatId, { text: `*${botName}*\nReply to a sticker with .toimg to convert it to an image.` }, { quoted: fakeContact });
    }
    
    await sock.sendMessage(chatId, { react: { text: '🔄', key: message.key } });
    
    try {
        const buffer = await downloadMediaMessage({ message: quotedMsg }, 'buffer', {});
        if (buffer) {
            await sock.sendMessage(chatId, { image: buffer, caption: `*${botName}*\nSticker converted to image` }, { quoted: fakeContact });
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        }
    } catch (err) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nConversion failed: ${err.message}` }, { quoted: fakeContact });
    }
}

module.exports = toimgCommand;
