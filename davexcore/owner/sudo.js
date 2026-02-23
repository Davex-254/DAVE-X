const settings = require('../../daveset');
const { isSudo, addSudo, removeSudo, getSudoList } = require('../../davelib/index');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

function extractMentionedJid(message) {
    try {
        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        if (mentioned.length > 0) return mentioned[0];

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const match = text.match(/\b(\d{7,15})\b/);
        if (match) return `${match[1]}@s.whatsapp.net`;

        return null;
    } catch (err) {
        console.error('extractMentionedJid error:', err.message, 'Line:', err.stack?.split('\n')[1]);
        return null;
    }
}

async function sudoCommand(sock, chatId, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const fake = createFakeContact(senderId);
    const botName = getBotName();

    try {
        const ownerJid = `${settings.ownerNumber}@s.whatsapp.net`;
        const isOwner = message.key.fromMe || senderId === ownerJid;

        const rawText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = rawText.trim().split(/\s+/).slice(1);
        const sub = (args[0] || '').toLowerCase();

        if (!sub || !['add', 'del', 'remove', 'list'].includes(sub)) {
            const helpText = `┌─ *${botName} SUDO* ─┐\n` +
                           `│\n` +
                           `│ Usage:\n` +
                           `│ • .sudo add @user\n` +
                           `│ • .sudo del @user\n` +
                           `│ • .sudo list\n` +
                           `│\n` +
                           `└──────────────────┘`;
            await sock.sendMessage(chatId, { text: helpText }, { quoted: fake });
            return;
        }

        if (sub === 'list') {
            const list = getSudoList();
            if (!list || list.length === 0) {
                await sock.sendMessage(chatId, { 
                    text: `┌─ *${botName}* ─┐\n│\n│ No sudo users set.\n│\n└─────────────┘` 
                }, { quoted: fake });
                return;
            }

            const formatted = list.map((jid, i) => `│ ${i + 1}. @${jid.split('@')[0]}`).join('\n');
            const listText = `┌─ *${botName} SUDO LIST* ─┐\n` +
                           `│\n` +
                           `${formatted}\n` +
                           `│\n` +
                           `└──────────────────────┘`;
            
            await sock.sendMessage(chatId, {
                text: listText,
                mentions: list
            }, { quoted: fake });
            return;
        }

        if (!isOwner) {
            await sock.sendMessage(chatId, { 
                text: `┌─ *${botName}* ─┐\n│\n│ Owner only command!\n│\n└─────────────┘` 
            }, { quoted: fake });
            return;
        }

        const targetJid = extractMentionedJid(message);
        if (!targetJid) {
            await sock.sendMessage(chatId, { 
                text: `┌─ *${botName}* ─┐\n│\n│ Mention a user or provide phone number!\n│\n└─────────────┘` 
            }, { quoted: fake });
            return;
        }

        if (sub === 'add') {
            if (isSudo(targetJid)) {
                await sock.sendMessage(chatId, {
                    text: `┌─ *${botName}* ─┐\n` +
                          `│\n` +
                          `│ @${targetJid.split('@')[0]} is already sudo!\n` +
                          `│\n` +
                          `└─────────────┘`,
                    mentions: [targetJid]
                }, { quoted: fake });
                return;
            }

            addSudo(targetJid);
            await sock.sendMessage(chatId, {
                text: `┌─ *${botName}* ─┐\n` +
                      `│\n` +
                      `│ ✓ @${targetJid.split('@')[0]} added as sudo!\n` +
                      `│\n` +
                      `└─────────────┘`,
                mentions: [targetJid]
            }, { quoted: fake });
        } else if (sub === 'del' || sub === 'remove') {
            if (!isSudo(targetJid)) {
                await sock.sendMessage(chatId, {
                    text: `┌─ *${botName}* ─┐\n` +
                          `│\n` +
                          `│ @${targetJid.split('@')[0]} is not sudo!\n` +
                          `│\n` +
                          `└─────────────┘`,
                    mentions: [targetJid]
                }, { quoted: fake });
                return;
            }

            removeSudo(targetJid);
            await sock.sendMessage(chatId, {
                text: `┌─ *${botName}* ─┐\n` +
                      `│\n` +
                      `│ ✗ @${targetJid.split('@')[0]} removed from sudo!\n` +
                      `│\n` +
                      `└─────────────┘`,
                mentions: [targetJid]
            }, { quoted: fake });
        }
    } catch (error) {
        console.error('Sudo command error:', error.message, 'Line:', error.stack?.split('\n')[1]);
        await sock.sendMessage(chatId, { 
            text: `┌─ *${botName}* ─┐\n│\n│ Sudo command failed!\n│\n└─────────────┘` 
        }, { quoted: fake });
    }
}

module.exports = { sudoCommand };