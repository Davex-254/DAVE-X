const { getGroupConfig, setGroupConfig, parseToggleCommand, parseActionCommand } = require('../../Database/settingsStore');
const db = require('../../Database/database');
const isAdmin = require('../../davelib/isAdmin');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function antimentionCommand(sock, chatId, message, senderId) {
    try {
        const fake = createFakeContact(senderId);
        const botName = getBotName();
        
        const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isSenderAdmin && !message.key.fromMe && !db.isSudo(senderId)) {
            await sock.sendMessage(chatId, { text: `*${botName}*\nAdmin only command!` }, { quoted: fake });
            return;
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = text.trim().split(' ').slice(1);
        const action = args[0]?.toLowerCase();

        const config = getGroupConfig(chatId, 'antimention') || { enabled: false, action: 'delete', maxMentions: 5 };

        if (!action) {
            const helpText = `*${botName} ANTIMENTION*\n\n` +
                `Status: ${config.enabled ? 'ON' : 'OFF'}\n` +
                `Action: ${config.action || 'delete'}\n` +
                `Max Mentions: ${config.maxMentions || 5}\n\n` +
                `*Commands:*\n` +
                `.antimention on - Enable\n` +
                `.antimention off - Disable\n` +
                `.antimention delete - Delete messages\n` +
                `.antimention warn - Warn user\n` +
                `.antimention kick - Kick user\n` +
                `.antimention max <num> - Set max mentions`;
            await sock.sendMessage(chatId, { text: helpText }, { quoted: fake });
            return;
        }

        let newConfig = { ...config };
        let responseText = '';

        const toggle = parseToggleCommand(action);
        if (toggle === 'on') {
            newConfig.enabled = true;
            responseText = `*${botName}*\nAntimention ENABLED`;
        } else if (toggle === 'off') {
            newConfig.enabled = false;
            responseText = `*${botName}*\nAntimention DISABLED`;
        } else {
            const parsedAction = parseActionCommand(action);
            if (parsedAction === 'delete' || parsedAction === 'warn' || parsedAction === 'kick') {
                newConfig.action = parsedAction;
                newConfig.enabled = true;
                responseText = `*${botName}*\nAntimention action: ${parsedAction.toUpperCase()}`;
            } else if (action === 'max' && args[1]) {
                const max = parseInt(args[1]);
                if (max >= 1 && max <= 20) {
                    newConfig.maxMentions = max;
                    responseText = `*${botName}*\nMax mentions set to ${max}`;
                } else {
                    responseText = `*${botName}*\nMax mentions must be 1-20`;
                }
            } else {
                responseText = `*${botName}*\nInvalid command! Use: on, off, delete, warn, kick, max`;
            }
        }

        if (responseText && !responseText.includes('Invalid') && !responseText.includes('must be')) {
            setGroupConfig(chatId, 'antimention', newConfig);
        }

        await sock.sendMessage(chatId, { text: responseText }, { quoted: fake });
    } catch (error) {
        console.error('Error in antimention command:', error.message, 'Line:', error.stack?.split('\n')[1]);
    }
}

async function handleMentionDetection(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) return;
        
        const config = getGroupConfig(chatId, 'antimention');
        if (!config?.enabled) return;

        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) return;
        if (isSenderAdmin) return;
        if (db.isSudo(senderId)) return;

        const mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const maxMentions = config.maxMentions || 5;

        if (mentionedJids.length <= maxMentions) return;

        const botName = getBotName();
        const userTag = `@${senderId.split('@')[0]}`;

        try {
            await sock.sendMessage(chatId, {
                delete: {
                    remoteJid: chatId,
                    fromMe: false,
                    id: message.key.id,
                    participant: senderId
                }
            });
        } catch (e) {
            console.error('Antimention delete failed:', e.message, 'Line:', e.stack?.split('\n')[1]);
            return;
        }

        if (config.action === 'kick') {
            await sock.sendMessage(chatId, {
                text: `*${botName}*\n${userTag} kicked for mass mentioning.`,
                mentions: [senderId]
            });
            await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
        } else if (config.action === 'warn') {
            const warnings = db.incrementWarning(chatId, senderId);
            await sock.sendMessage(chatId, {
                text: `*${botName}*\n${userTag}, too many mentions!\nWarning ${warnings}/3`,
                mentions: [senderId]
            });
            if (warnings >= 3) {
                await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
                db.resetWarning(chatId, senderId);
            }
        } else {
            await sock.sendMessage(chatId, {
                text: `*${botName}*\n${userTag}, max ${maxMentions} mentions allowed!`,
                mentions: [senderId]
            });
        }
    } catch (error) {
        console.error('Error in antimention detection:', error.message, 'Line:', error.stack?.split('\n')[1]);
    }
}

module.exports = {
    antimentionCommand,
    handleMentionDetection
};
