const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

function resolveTarget(message) {
    const contextInfo = message.message?.extendedTextMessage?.contextInfo;
    const quotedParticipant = contextInfo?.participant;
    const mentionedJids = contextInfo?.mentionedJid || [];
    const text = message.message?.conversation ||
                 message.message?.extendedTextMessage?.text || '';
    const argNumber = text.split(/\s+/).slice(1).join('').replace(/[^0-9]/g, '');

    if (quotedParticipant) return quotedParticipant;
    if (mentionedJids.length > 0) return mentionedJids[0];
    if (argNumber.length >= 7) return `${argNumber}@s.whatsapp.net`;
    return null;
}

async function blockCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    try {
        if (!message.key.fromMe) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | Owner only command.`
            }, { quoted: fake });
        }

        const userToBlock = resolveTarget(message);

        if (!userToBlock) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | How to block:\n\n• Reply to a message → .block\n• Mention: .block @user\n• By number: .block 254712345678`
            }, { quoted: fake });
        }

        const botId = (sock.user?.id || '').split(':')[0];
        if (userToBlock.includes(botId)) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | Cannot block the bot itself!`
            }, { quoted: fake });
        }

        await sock.updateBlockStatus(userToBlock, 'block');
        const num = userToBlock.split('@')[0];
        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | ✅ Blocked +${num}`,
            mentions: [userToBlock]
        }, { quoted: fake });

    } catch (error) {
        console.error('blockCommand error:', error.message);
        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | ❌ Block failed — reply to the user's message or mention them.`
        }, { quoted: fake }).catch(() => {});
    }
}

async function unblockCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    try {
        if (!message.key.fromMe) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | Owner only command.`
            }, { quoted: fake });
        }

        const userToUnblock = resolveTarget(message);

        if (!userToUnblock) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | How to unblock:\n\n• Mention: .unblock @user\n• By number: .unblock 254712345678`
            }, { quoted: fake });
        }

        await sock.updateBlockStatus(userToUnblock, 'unblock');
        const num = userToUnblock.split('@')[0];
        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | ✅ Unblocked +${num}`,
            mentions: [userToUnblock]
        }, { quoted: fake });

    } catch (error) {
        console.error('unblockCommand error:', error.message);
        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | ❌ Unblock failed.`
        }, { quoted: fake }).catch(() => {});
    }
}

async function blocklistCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    try {
        if (!message.key.fromMe) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | Owner only command.`
            }, { quoted: fake });
        }

        const blockedContacts = await sock.fetchBlocklist().catch(() => []);
        if (!blockedContacts.length) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | No blocked contacts.`
            }, { quoted: fake });
        }

        const total = blockedContacts.length;
        const listText = blockedContacts
            .slice(0, 30)
            .map((jid, i) => `${i + 1}. +${jid.split('@')[0]}`)
            .join('\n');

        let text = `✦ *${botName}* | Blocklist\n\n📋 Total: *${total}*\n\n${listText}`;
        if (total > 30) text += `\n\n... and ${total - 30} more`;

        await sock.sendMessage(chatId, { text }, { quoted: fake });
    } catch (error) {
        console.error('blocklistCommand error:', error.message);
        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | ❌ Failed to fetch blocklist.`
        }, { quoted: fake }).catch(() => {});
    }
}

async function unblockallCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    try {
        if (!message.key.fromMe) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | Owner only command.`
            }, { quoted: fake });
        }

        const blockedContacts = await sock.fetchBlocklist().catch(() => []);
        if (!blockedContacts.length) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | No blocked contacts to unblock.`
            }, { quoted: fake });
        }

        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | 🔄 Unblocking ${blockedContacts.length} contacts...`
        }, { quoted: fake });

        let successCount = 0;
        for (const jid of blockedContacts) {
            try {
                await sock.updateBlockStatus(jid, 'unblock');
                successCount++;
                if (successCount % 10 === 0) {
                    await sock.sendMessage(chatId, {
                        text: `✦ *${botName}* | Progress: ${successCount}/${blockedContacts.length}...`
                    }, { quoted: fake });
                }
                await delay(500);
            } catch { }
        }

        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | ✅ Unblocked ${successCount}/${blockedContacts.length} contacts.`
        }, { quoted: fake });
    } catch (error) {
        console.error('unblockallCommand error:', error.message);
        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | ❌ Failed to unblock all.`
        }, { quoted: fake }).catch(() => {});
    }
}

module.exports = {
    blockCommand,
    unblockCommand,
    blocklistCommand,
    unblockallCommand
};
