const isAdmin = require('../../davelib/isAdmin');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const db = require('../../Database/database');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function downloadMediaMessage(message, mediaType) {
    const stream = await downloadContentFromMessage(message, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    const tempDir = path.join(__dirname, '../temp/');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    const filePath = path.join(tempDir, `${Date.now()}.${mediaType}`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

async function tagCommand(sock, chatId, senderId, messageText, replyMessage, message) {
    const fake = createFakeContact(senderId);
    const botName = getBotName();
    
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nBot needs to be admin!` }, { quoted: fake });
        return;
    }

    if (!isSenderAdmin && !message?.key?.fromMe && !db.isSudo(senderId)) {
        const stickerPath = './assets/sticktag.webp';
        if (fs.existsSync(stickerPath)) {
            const stickerBuffer = fs.readFileSync(stickerPath);
            await sock.sendMessage(chatId, { sticker: stickerBuffer });
        }
        return;
    }

    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;
        const mentionedJidList = participants.map(p => p.id);

        if (replyMessage) {
            let messageContent = {};

            if (replyMessage.imageMessage) {
                const filePath = await downloadMediaMessage(replyMessage.imageMessage, 'image');
                messageContent = {
                    image: { url: filePath },
                    caption: messageText || replyMessage.imageMessage.caption || '',
                    mentions: mentionedJidList
                };
                await sock.sendMessage(chatId, messageContent);
                fs.unlinkSync(filePath);
            } else if (replyMessage.videoMessage) {
                const filePath = await downloadMediaMessage(replyMessage.videoMessage, 'video');
                messageContent = {
                    video: { url: filePath },
                    caption: messageText || replyMessage.videoMessage.caption || '',
                    mentions: mentionedJidList
                };
                await sock.sendMessage(chatId, messageContent);
                fs.unlinkSync(filePath);
            } else if (replyMessage.stickerMessage) {
                const filePath = await downloadMediaMessage(replyMessage.stickerMessage, 'sticker');
                messageContent = {
                    sticker: { url: filePath },
                    mentions: mentionedJidList
                };
                await sock.sendMessage(chatId, messageContent);
                fs.unlinkSync(filePath);
            } else if (replyMessage.audioMessage) {
                const filePath = await downloadMediaMessage(replyMessage.audioMessage, 'audio');
                messageContent = {
                    audio: { url: filePath },
                    ptt: replyMessage.audioMessage.ptt || false,
                    mentions: mentionedJidList
                };
                await sock.sendMessage(chatId, messageContent);
                fs.unlinkSync(filePath);
            } else {
                const quotedText = replyMessage.conversation || 
                                   replyMessage.extendedTextMessage?.text || 
                                   messageText || '';
                await sock.sendMessage(chatId, {
                    text: quotedText,
                    mentions: mentionedJidList
                });
            }
        } else if (messageText) {
            await sock.sendMessage(chatId, {
                text: messageText,
                mentions: mentionedJidList
            });
        } else {
            await sock.sendMessage(chatId, {
                text: `*${botName}*\nUsage: .tag <message> or reply to a message`
            }, { quoted: fake });
        }
    } catch (error) {
        console.error('Tag error:', error.message, 'Line:', error.stack?.split('\n')[1]);
        await sock.sendMessage(chatId, { text: `*${botName}*\nError: ${error.message}` }, { quoted: fake });
    }
}

module.exports = tagCommand;
