const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage, normalizeMessageContent } = require('@whiskeysockets/baileys');
const { writeFile, unlink, readdir, stat } = require('fs/promises');
const { getOwnerConfig, setOwnerConfig } = require('../../Database/settingsStore');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

const statusStore = new Map();
const deletedStatusStore = new Map();
const STATUS_MEDIA_DIR = path.join(__dirname, '../tmp/status_media');

const DEFAULT_STATUS_CONFIG = {
    enabled: true,
    mode: 'private',
    captureMedia: true,
    maxStorageMB: 100,
    cleanupInterval: 30,
    autoCleanup: true,
    maxStatuses: 200,
    notifyOwner: true,
    cleanRetrieved: true,
    maxAgeHours: 12
};

let statusCleanupInterval = null;
initializeStatusSystem();
function initializeStatusSystem() {
    ensureStatusMediaDir();
    startStatusCleanupInterval();
}

async function ensureStatusMediaDir() {
    try {
        await fs.promises.mkdir(STATUS_MEDIA_DIR, { recursive: true });
    } catch (err) {}
}

async function getStatusFolderSizeInMB() {
    try {
        const files = await readdir(STATUS_MEDIA_DIR);
        let totalSize = 0;
        for (const file of files) {
            const filePath = path.join(STATUS_MEDIA_DIR, file);
            try {
                const stats = await stat(filePath);
                if (stats.isFile()) totalSize += stats.size;
            } catch {}
        }
        return totalSize / (1024 * 1024);
    } catch {
        return 0;
    }
}

async function cleanStatusMediaFolder() {
    try {
        const config = loadStatusConfig();
        const sizeMB = await getStatusFolderSizeInMB();
        if (sizeMB > config.maxStorageMB) {
            const files = await readdir(STATUS_MEDIA_DIR);
            let deletedCount = 0;
            for (const file of files) {
                const filePath = path.join(STATUS_MEDIA_DIR, file);
                try {
                    await unlink(filePath);
                    deletedCount++;
                } catch {}
            }
            return deletedCount;
        }
        return 0;
    } catch {
        return 0;
    }
}

function loadStatusConfig() {
    try {
        const config = getOwnerConfig('status_antidelete');
        if (!config || typeof config !== 'object') {
            saveStatusConfig(DEFAULT_STATUS_CONFIG);
            return { ...DEFAULT_STATUS_CONFIG };
        }
        return { ...DEFAULT_STATUS_CONFIG, ...config };
    } catch {
        return { ...DEFAULT_STATUS_CONFIG };
    }
}

function saveStatusConfig(config) {
    try {
        setOwnerConfig('status_antidelete', config);
        return true;
    } catch {
        return false;
    }
}

function startStatusCleanupInterval() {
    const config = loadStatusConfig();
    if (statusCleanupInterval) clearInterval(statusCleanupInterval);
    statusCleanupInterval = setInterval(() => {
        cleanStatusMediaFolder().catch(() => {});
        autoCleanOldStatuses();
    }, config.cleanupInterval * 60 * 1000);
}

async function isStatusAuthorized(message) {
    try {
        const { isSudo } = require('../../davelib/index');
        const senderId = message.key.participant || message.key.remoteJid;
        return message.key.fromMe || await isSudo(senderId);
    } catch {
        return message.key.fromMe;
    }
}

async function handleStatusAntideleteCommand(sock, chatId, message, match) {
    if (!await isStatusAuthorized(message)) {
        const fakeContact = createFakeContact(message);
        return sock.sendMessage(chatId, {
            text: 'Owner only'
        }, { quoted: fakeContact });
    }

    const fakeContact = createFakeContact(message);
    const config = loadStatusConfig();

    if (!match) {
        return showStatusAntideleteStatus(sock, chatId, fakeContact, config);
    }

    const command = match.toLowerCase().trim();
    return processStatusCommand(sock, chatId, fakeContact, command, config);
}

async function showStatusAntideleteStatus(sock, chatId, fakeContact, config) {
    const sizeMB = await getStatusFolderSizeInMB();

    const text = `*STATUS ANTIDELETE*\n\n` +
                `Status: ${config.enabled ? 'ON' : 'OFF'}\n` +
                `Mode: ${config.mode}\n` +
                `Storage: ${sizeMB.toFixed(1)}MB / ${config.maxStorageMB}MB\n` +
                `Cached: ${statusStore.size} statuses\n` +
                `Deleted: ${deletedStatusStore.size} captured\n\n` +
                `*Commands:*\n` +
                `on/off - Toggle\n` +
                `private - Send to owner DM\n` +
                `chat - Send in original chat\n` +
                `both - Send to both\n` +
                `clean - Clear media storage\n` +
                `stats - View statistics\n` +
                `list - Recent deleted statuses\n` +
                `settings - View settings`;

    await sock.sendMessage(chatId, { text }, { quoted: fakeContact });
}

async function processStatusCommand(sock, chatId, fakeContact, command, config) {
    let responseText = '';

    switch (command) {
        case 'on':
            config.enabled = true;
            responseText = 'Status Antidelete: ON';
            break;
        case 'off':
            config.enabled = false;
            responseText = 'Status Antidelete: OFF';
            break;
        case 'private':
            config.mode = 'private';
            responseText = 'Mode set to: Private (owner DM only)';
            break;
        case 'chat':
            config.mode = 'chat';
            responseText = 'Mode set to: Chat (original chat)';
            break;
        case 'both':
            config.mode = 'both';
            responseText = 'Mode set to: Both (DM + chat)';
            break;
        case 'clean': {
            const deletedCount = await cleanStatusMediaFolder();
            responseText = `Cleaned ${deletedCount} media files`;
            break;
        }
        case 'stats': {
            const sizeMB = await getStatusFolderSizeInMB();
            responseText = `*Status Antidelete Stats*\n\nCached: ${statusStore.size}\nDeleted captured: ${deletedStatusStore.size}\nStorage: ${sizeMB.toFixed(1)}MB / ${config.maxStorageMB}MB\nMax age: ${config.maxAgeHours}h\nAuto cleanup: ${config.autoCleanup ? 'ON' : 'OFF'}`;
            break;
        }
        case 'list': {
            const recentStatuses = Array.from(deletedStatusStore.values())
                .slice(-5)
                .reverse();

            if (recentStatuses.length === 0) {
                responseText = 'No deleted statuses recorded yet.';
            } else {
                responseText = '*Recent Deleted Statuses:*\n\n';
                recentStatuses.forEach((status, index) => {
                    const time = new Date(status.timestamp).toLocaleTimeString();
                    const sender = status.senderNumber || status.sender.split('@')[0];
                    const name = status.pushName || 'Unknown';
                    responseText += `${index + 1}. ${name} (+${sender})\n   Type: ${status.mediaType || 'text'} | ${time}\n`;
                });
            }
            break;
        }
        case 'settings': {
            responseText = `*Current Settings:*\n\n` +
                `Enabled: ${config.enabled}\n` +
                `Mode: ${config.mode}\n` +
                `Capture media: ${config.captureMedia}\n` +
                `Max storage: ${config.maxStorageMB}MB\n` +
                `Cleanup interval: ${config.cleanupInterval}min\n` +
                `Auto cleanup: ${config.autoCleanup}\n` +
                `Max statuses: ${config.maxStatuses}\n` +
                `Max age: ${config.maxAgeHours}h\n` +
                `Notify owner: ${config.notifyOwner}\n` +
                `Clean after retrieval: ${config.cleanRetrieved}`;
            break;
        }
        default:
            responseText = 'Unknown command. Use: on, off, private, chat, both, clean, stats, list, settings';
    }

    if (!responseText.startsWith('Unknown')) {
        saveStatusConfig(config);
        startStatusCleanupInterval();
    }

    await sock.sendMessage(chatId, { text: responseText }, { quoted: fakeContact });
}

async function storeStatusMessage(sock, message) {
    try {
        await ensureStatusMediaDir();
        const config = loadStatusConfig();
        if (!config.enabled) return;

        if (!message.key?.id) return;
        if (message.key.fromMe) return;
        if (message.key.remoteJid !== 'status@broadcast') return;

        const msgContent = normalizeMessageContent(message.message) || message.message;
        if (!msgContent) return;

        const protoMsg = msgContent?.protocolMessage;
        if (protoMsg && (protoMsg.type === 0 || protoMsg.type === 4)) {
            return;
        }

        if (statusStore.size >= config.maxStatuses) {
            const firstKey = statusStore.keys().next().value;
            const oldStatus = statusStore.get(firstKey);
            statusStore.delete(firstKey);
            if (oldStatus?.mediaPath) {
                unlink(oldStatus.mediaPath).catch(() => {});
            }
        }

        const statusId = message.key.id;
        const sender = message.key.participant || message.key.remoteJid;
        const pushName = message.pushName || 'Unknown';
        let senderNumber = sender.split('@')[0].split(':')[0];

        if (sender.includes('@lid') || senderNumber.length > 15 || !/^\d+$/.test(senderNumber)) {
            try {
                if (sock?.signalRepository?.lidMapping?.getPNForLID) {
                    const formats = [sender, `${senderNumber}:0@lid`, `${senderNumber}@lid`];
                    for (const fmt of formats) {
                        try {
                            const pn = await sock.signalRepository.lidMapping.getPNForLID(fmt);
                            if (pn) {
                                const num = String(pn).split('@')[0].replace(/[^0-9]/g, '');
                                if (num.length >= 7 && num.length <= 15 && num !== senderNumber) {
                                    senderNumber = num;
                                    break;
                                }
                            }
                        } catch {}
                    }
                }
            } catch {}
        }

        const storedStatus = {
            id: statusId,
            sender,
            senderNumber,
            pushName,
            chatId: message.key.remoteJid,
            type: 'status',
            mediaType: '',
            mediaPath: '',
            content: '',
            timestamp: Date.now(),
            isDeleted: false
        };

        await extractStatusContent(msgContent, storedStatus, config);

        if (storedStatus.content || storedStatus.mediaType) {
            statusStore.set(statusId, storedStatus);
        }

    } catch (err) {}
}

async function extractStatusContent(msg, storedStatus, config) {
    try {
        if (!msg) return;

        if (msg.imageMessage) {
            storedStatus.mediaType = 'image';
            storedStatus.content = msg.imageMessage.caption || '';
            if (config.captureMedia) {
                storedStatus.mediaPath = await downloadStatusMedia(
                    msg.imageMessage,
                    'image',
                    `${storedStatus.timestamp}_status.jpg`
                );
            }
        } else if (msg.videoMessage) {
            storedStatus.mediaType = 'video';
            storedStatus.content = msg.videoMessage.caption || '';
            if (config.captureMedia) {
                storedStatus.mediaPath = await downloadStatusMedia(
                    msg.videoMessage,
                    'video',
                    `${storedStatus.timestamp}_status.mp4`
                );
            }
        } else if (msg.audioMessage) {
            storedStatus.mediaType = 'audio';
            if (config.captureMedia) {
                const mime = msg.audioMessage.mimetype || '';
                const ext = mime.includes('mpeg') ? 'mp3' : (mime.includes('ogg') ? 'ogg' : 'mp3');
                storedStatus.mediaPath = await downloadStatusMedia(
                    msg.audioMessage,
                    'audio',
                    `${storedStatus.timestamp}_status.${ext}`
                );
            }
        } else if (msg.extendedTextMessage?.text) {
            storedStatus.content = msg.extendedTextMessage.text;
            storedStatus.mediaType = 'text';
        } else if (msg.conversation) {
            storedStatus.content = msg.conversation;
            storedStatus.mediaType = 'text';
        }
    } catch {}
}

async function downloadStatusMedia(message, type, fileName) {
    try {
        const stream = await downloadContentFromMessage(message, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        const filePath = path.join(STATUS_MEDIA_DIR, fileName);
        await writeFile(filePath, buffer);
        return filePath;
    } catch {
        return null;
    }
}

async function handleStatusProtocolRevoke(sock, message) {
    try {
        const config = loadStatusConfig();
        if (!config.enabled) return;

        if (message.key.remoteJid !== 'status@broadcast') return;

        const msgContent = normalizeMessageContent(message.message) || message.message;
        if (!msgContent) return;

        const protoMsg = msgContent?.protocolMessage;
        if (!protoMsg || protoMsg.type !== 0) return;

        const revokedId = protoMsg.key?.id;
        if (!revokedId) return;

        const original = statusStore.get(revokedId);
        if (!original) return;

        statusStore.delete(revokedId);
        deletedStatusStore.set(revokedId, {
            ...original,
            deletedAt: Date.now(),
            isDeleted: true
        });

        if (config.notifyOwner) {
            await sendStatusDeletionNotification(sock, original, config);
        }

        if (config.cleanRetrieved && original.mediaPath) {
            setTimeout(() => unlink(original.mediaPath).catch(() => {}), 5000);
        }
    } catch {}
}

async function handleStatusUpdateDeletion(sock, update) {
    try {
        const config = loadStatusConfig();
        if (!config.enabled) return;

        const msgKey = update.key;
        if (!msgKey?.id) return;

        const chatJid = msgKey.remoteJidAlt || msgKey.remoteJid;
        if (chatJid !== 'status@broadcast') return;

        const isDeleted =
            update.update?.message === null ||
            update.update?.messageStubType === 1 ||
            update.messageStubType === 1 ||
            update.update?.messageStubType === 132;

        if (!isDeleted) return;

        const statusId = msgKey.id;
        const original = statusStore.get(statusId);
        if (!original) return;

        statusStore.delete(statusId);
        deletedStatusStore.set(statusId, {
            ...original,
            deletedAt: Date.now(),
            isDeleted: true
        });

        if (config.notifyOwner) {
            await sendStatusDeletionNotification(sock, original, config);
        }

        if (config.cleanRetrieved && original.mediaPath) {
            setTimeout(() => unlink(original.mediaPath).catch(() => {}), 5000);
        }
    } catch {}
}

async function handleStatusDeletion(sock, message) {
    await handleStatusProtocolRevoke(sock, message);
}

async function sendStatusDeletionNotification(sock, status, config) {
    try {
        const ownerNumber = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        const senderNum = status.senderNumber || status.sender.split('@')[0];
        const time = new Date(status.timestamp).toLocaleString();

        let text = `*DELETED STATUS DETECTED*\n\n`;
        text += `From: +${senderNum}\n`;
        text += `Name: ${status.pushName}\n`;
        text += `Time: ${time}\n`;
        text += `Type: ${status.mediaType || 'text'}\n`;

        if (status.content) {
            text += `\nContent:\n${status.content.substring(0, 500)}`;
            if (status.content.length > 500) text += '...';
        }

        const targets = [];
        if (config.mode === 'private' || config.mode === 'both') {
            targets.push(ownerNumber);
        }
        if (config.mode === 'chat' || config.mode === 'both') {
            const senderJid = status.sender.includes('@') ? status.sender : status.sender + '@s.whatsapp.net';
            if (senderJid !== ownerNumber || config.mode === 'chat') {
                targets.push(senderJid);
            }
        }

        for (const target of targets) {
            try {
                if (status.mediaType === 'image' && status.mediaPath && fs.existsSync(status.mediaPath)) {
                    await sock.sendMessage(target, {
                        image: { url: status.mediaPath },
                        caption: text
                    });
                } else if (status.mediaType === 'video' && status.mediaPath && fs.existsSync(status.mediaPath)) {
                    await sock.sendMessage(target, {
                        video: { url: status.mediaPath },
                        caption: text
                    });
                } else if (status.mediaType === 'audio' && status.mediaPath && fs.existsSync(status.mediaPath)) {
                    await sock.sendMessage(target, {
                        audio: { url: status.mediaPath },
                        mimetype: 'audio/mpeg'
                    });
                    await sock.sendMessage(target, { text });
                } else {
                    await sock.sendMessage(target, { text });
                }
            } catch {}
        }
    } catch {}
}

function autoCleanOldStatuses() {
    try {
        const config = loadStatusConfig();
        const maxAge = config.maxAgeHours * 60 * 60 * 1000;
        const now = Date.now();

        for (const [id, status] of statusStore.entries()) {
            if (now - status.timestamp > maxAge) {
                statusStore.delete(id);
                if (status.mediaPath) {
                    unlink(status.mediaPath).catch(() => {});
                }
            }
        }

        for (const [id, status] of deletedStatusStore.entries()) {
            if (now - status.timestamp > maxAge) {
                deletedStatusStore.delete(id);
            }
        }
    } catch {}
}

module.exports = {
    handleStatusAntideleteCommand,
    handleStatusDeletion,
    handleStatusUpdateDeletion,
    storeStatusMessage,
    cleanStatusMediaFolder
};
