const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { getOwnerConfig, setOwnerConfig, parseToggleCommand } = require('../../Database/settingsStore');
const db = require('../../Database/database');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function isAuthorized(sock, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        if (message.key.fromMe) return true;
        return db.isSudo(senderId);
    } catch {
        return message.key.fromMe;
    }
}

function loadState() {
    try {
        const config = getOwnerConfig('mention');
        return config || { enabled: false, assetPath: 'assets/mention_default.webp', type: 'sticker' };
    } catch {
        return { enabled: false, assetPath: 'assets/mention_default.webp', type: 'sticker' };
    }
}

function saveState(state) {
    setOwnerConfig('mention', state);
}

async function ensureDefaultSticker(state) {
    try {
        const assetPath = path.join(__dirname, '..', state.assetPath);
        if (state.assetPath.endsWith('mention_default.webp') && !fs.existsSync(assetPath)) {
            const url = 'https://o.uguu.se/KHSyEtdc.webp';
            const res = await axios.get(url, { responseType: 'arraybuffer' });
            const assetsDir = path.join(__dirname, '..', 'assets');
            if (!fs.existsSync(assetsDir)) {
                fs.mkdirSync(assetsDir, { recursive: true });
            }
            fs.writeFileSync(assetPath, Buffer.from(res.data));
        }
    } catch (e) {
        // Silently ignore - sticker download may fail on external hosts
    }
}

async function handleMentionDetection(sock, chatId, message) {
    try {
        if (message.key?.fromMe) return;

        const state = loadState();
        await ensureDefaultSticker(state);
        if (!state.enabled) return;

        const rawId = sock.user?.id || sock.user?.jid || '';
        if (!rawId) return;
        const botNum = rawId.split('@')[0].split(':')[0];
        const botJids = [
            `${botNum}@s.whatsapp.net`,
            `${botNum}@whatsapp.net`,
            rawId
        ];

        const msg = message.message || {};
        const contexts = [
            msg.extendedTextMessage?.contextInfo,
            msg.imageMessage?.contextInfo,
            msg.videoMessage?.contextInfo,
            msg.documentMessage?.contextInfo,
            msg.stickerMessage?.contextInfo,
            msg.buttonsResponseMessage?.contextInfo,
            msg.listResponseMessage?.contextInfo
        ].filter(Boolean);

        let mentioned = [];
        for (const c of contexts) {
            if (Array.isArray(c.mentionedJid)) {
                mentioned = mentioned.concat(c.mentionedJid);
            }
        }

        if (!mentioned.length) return;
        const isBotMentioned = mentioned.some(j => botJids.includes(j));
        if (!isBotMentioned) return;

        const assetPath = path.join(__dirname, '..', state.assetPath);
        if (state.type === 'sticker' && fs.existsSync(assetPath)) {
            await sock.sendMessage(chatId, { sticker: fs.readFileSync(assetPath) }, { quoted: fakeContact });
            return;
        }
        if (fs.existsSync(assetPath)) {
            const payload = {};
            if (state.type === 'image') {
                payload.image = fs.readFileSync(assetPath);
            } else if (state.type === 'video') {
                payload.video = fs.readFileSync(assetPath);
            } else if (state.type === 'audio') {
                payload.audio = fs.readFileSync(assetPath);
                payload.ptt = true;
            }
            if (Object.keys(payload).length) {
                await sock.sendMessage(chatId, payload, { quoted: fakeContact });
            }
        }
    } catch (error) {
        console.error('Mention detection error:', error?.message, 'Line:', error?.stack?.split('\n')[1]);
    }
}

async function mentionToggleCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const fake = createFakeContact(senderId);
        const botName = getBotName();

        if (!await isAuthorized(sock, message)) {
            await sock.sendMessage(chatId, { text: `*${botName}*\nOwner only command!` }, { quoted: fake });
            return;
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = text.trim().split(' ').slice(1);
        const action = args[0]?.toLowerCase();

        const state = loadState();

        if (!action) {
            const helpText = `*${botName} MENTION REPLY*\n\n` +
                `Status: ${state.enabled ? 'ON' : 'OFF'}\n` +
                `Type: ${state.type}\n\n` +
                `*Commands:*\n` +
                `.mention on - Enable\n` +
                `.mention off - Disable\n` +
                `.setmention - Set custom sticker/image`;
            await sock.sendMessage(chatId, { text: helpText }, { quoted: fake });
            return;
        }

        const toggle = parseToggleCommand(action);
        if (toggle === 'on') {
            state.enabled = true;
            saveState(state);
            await sock.sendMessage(chatId, { text: `*${botName}*\nMention reply ENABLED` }, { quoted: fake });
        } else if (toggle === 'off') {
            state.enabled = false;
            saveState(state);
            await sock.sendMessage(chatId, { text: `*${botName}*\nMention reply DISABLED` }, { quoted: fake });
        } else {
            await sock.sendMessage(chatId, { text: `*${botName}*\nUse: on or off` }, { quoted: fake });
        }
    } catch (error) {
        console.error('Error in mention toggle:', error.message, 'Line:', error.stack?.split('\n')[1]);
    }
}

async function setMentionCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const fake = createFakeContact(senderId);
        const botName = getBotName();

        if (!await isAuthorized(sock, message)) {
            await sock.sendMessage(chatId, { text: `*${botName}*\nOwner only command!` }, { quoted: fake });
            return;
        }

        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted) {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nReply to a sticker, image, video, or audio to set it as mention reply.`
            }, { quoted: fake });
            return;
        }

        const state = loadState();
        let mediaType = null;
        let mediaMessage = null;

        if (quoted.stickerMessage) {
            mediaType = 'sticker';
            mediaMessage = quoted.stickerMessage;
        } else if (quoted.imageMessage) {
            mediaType = 'image';
            mediaMessage = quoted.imageMessage;
        } else if (quoted.videoMessage) {
            mediaType = 'video';
            mediaMessage = quoted.videoMessage;
        } else if (quoted.audioMessage) {
            mediaType = 'audio';
            mediaMessage = quoted.audioMessage;
        }

        if (!mediaType || !mediaMessage) {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nUnsupported media type. Use sticker, image, video, or audio.`
            }, { quoted: fake });
            return;
        }

        try {
            const stream = await downloadContentFromMessage(mediaMessage, mediaType === 'sticker' ? 'sticker' : mediaType);
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const assetsDir = path.join(__dirname, '..', 'assets');
            if (!fs.existsSync(assetsDir)) {
                fs.mkdirSync(assetsDir, { recursive: true });
            }

            const ext = mediaType === 'sticker' ? 'webp' : (mediaType === 'image' ? 'jpg' : (mediaType === 'video' ? 'mp4' : 'mp3'));
            const filename = `mention_custom.${ext}`;
            const filePath = path.join(assetsDir, filename);
            fs.writeFileSync(filePath, buffer);

            state.assetPath = `assets/${filename}`;
            state.type = mediaType;
            state.enabled = true;
            saveState(state);

            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nMention reply set to ${mediaType}!`
            }, { quoted: fake });
        } catch (downloadError) {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nFailed to download media: ${downloadError.message}`
            }, { quoted: fake });
        }
    } catch (error) {
        console.error('Error in setmention:', error.message, 'Line:', error.stack?.split('\n')[1]);
    }
}

module.exports = {
    handleMentionDetection,
    mentionToggleCommand,
    setMentionCommand
};
