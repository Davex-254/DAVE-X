const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { TelegraPh } = require('../../davelib/uploader');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function uploadToCatbox(filePath) {
    const form = new FormData();
    form.append("reqtype", "fileupload");
    form.append("fileToUpload", fs.createReadStream(filePath));

    const res = await axios.post("https://catbox.moe/user/api.php", form, {
        headers: form.getHeaders()
    });

    return res.data;
}

async function extractMedia(message) {
    const m = message.message || {};

    const handlers = {
        imageMessage: { type: 'image', ext: '.jpg' },
        videoMessage: { type: 'video', ext: '.mp4' },
        audioMessage: { type: 'audio', ext: '.mp3' },
        documentMessage: { type: 'document', ext: null },
        stickerMessage: { type: 'sticker', ext: '.webp' }
    };

    for (const key in handlers) {
        if (m[key]) {
            const { type, ext } = handlers[key];
            const stream = await downloadContentFromMessage(m[key], type);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);

            if (key === 'documentMessage') {
                const fileName = m.documentMessage.fileName || 'file.bin';
                return { buffer: Buffer.concat(chunks), ext: path.extname(fileName) || '.bin' };
            }

            return { buffer: Buffer.concat(chunks), ext };
        }
    }

    return null;
}

async function extractQuotedMedia(message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return null;
    return extractMedia({ message: quoted });
}

async function urlCommand(sock, chatId, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const fakeContact = createFakeContact(senderId);
    
    try {
        await sock.sendMessage(chatId, { react: { text: '🔺', key: message.key } });

        let media = await extractMedia(message) || await extractQuotedMedia(message);

        if (!media) {
            return sock.sendMessage(
                chatId,
                { text: 'Provide media attachment for link generation' },
                { quoted: fakeContact }
            );
        }

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        const tempPath = path.join(tempDir, `${Date.now()}${media.ext}`);
        fs.writeFileSync(tempPath, media.buffer);

        let url;
        try {
            if (['.jpg', '.png', '.webp'].includes(media.ext)) {
                try {
                    url = await TelegraPh(tempPath);
                } catch {
                    url = await uploadToCatbox(tempPath);
                }
            } else {
                url = await uploadToCatbox(tempPath);
            }
        } finally {
            setTimeout(() => {
                if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            }, 2000);
        }

        if (!url) {
            return sock.sendMessage(chatId, { text: 'Media upload unsuccessful' }, { quoted: fakeContact });
        }

        await sock.sendMessage(
            chatId,
            { text: `${url}` },
            { quoted: fakeContact }
        );

    } catch (error) {
        console.error('[URL] error:', error?.message || error);
        await sock.sendMessage(chatId, { text: 'Media conversion to link failed' }, { quoted: fakeContact });
    }
}

module.exports = urlCommand;