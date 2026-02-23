const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const webp = require('node-webpmux');
const crypto = require('crypto');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function takeCommand(sock, chatId, message, args) {
    const fkontak = createFakeContact(message);
    
    try {
        const pushname = message.pushName || "Unknown User"; 
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        if (!quotedMessage?.stickerMessage) {
            await sock.sendMessage(chatId, { text: 'Reply to a sticker with .take <packname>' }, { quoted: fkontak });
            return;
        }

        const packname = args.join(' ') || `${pushname}`;

        try {
            const stickerBuffer = await downloadMediaMessage(
                {
                    key: message.message.extendedTextMessage.contextInfo.stanzaId,
                    message: quotedMessage,
                    messageType: 'stickerMessage'
                },
                'buffer',
                {},
                {
                    logger: console,
                    reuploadRequest: sock.updateMediaMessage
                }
            );

            if (!stickerBuffer) {
                await sock.sendMessage(chatId, { text: 'Failed to download sticker' }, { quoted: fkontak });
                return;
            }

            const img = new webp.Image();
            await img.load(stickerBuffer);

            const json = {
                'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
                'sticker-pack-name': packname,
                'emojis': ['🤖']
            };

            const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]);
            const jsonBuffer = Buffer.from(JSON.stringify(json), 'utf8');
            const exif = Buffer.concat([exifAttr, jsonBuffer]);
            exif.writeUIntLE(jsonBuffer.length, 14, 4);

            img.exif = exif;

            const finalBuffer = await img.save(null);

            await sock.sendMessage(chatId, {
                sticker: finalBuffer
            }, {
                quoted: fkontak
            });

        } catch (error) {
            console.error('Sticker error:', error);
            await sock.sendMessage(chatId, { text: 'Error processing sticker' }, { quoted: fkontak });
        }

    } catch (error) {
        console.error('Take command error:', error);
        await sock.sendMessage(chatId, { text: 'Command error' }, { quoted: fkontak });
    }
}

module.exports = takeCommand;