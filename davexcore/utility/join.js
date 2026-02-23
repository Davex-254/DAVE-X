const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function joinCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    const botName = getBotName();

    try {
        const text = message.message?.conversation ||
                     message.message?.extendedTextMessage?.text || '';

        const parts = text.trim().split(/\s+/);
        const inviteLink = parts[1] || '';

        if (!inviteLink) {
            return await sock.sendMessage(chatId, {
                text: `✦ *${botName}* | Join Group\n\nUse: .join <invite_link>\nExample: .join https://chat.whatsapp.com/XXXXXX`
            }, { quoted: fake });
        }

        const code = inviteLink.replace(/^https?:\/\/chat\.whatsapp\.com\//i, '').trim();

        if (!code) {
            return await sock.sendMessage(chatId, {
                text: `✦ *${botName}* | Invalid invite link.`
            }, { quoted: fake });
        }

        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        await sock.groupAcceptInvite(code);

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | Successfully joined the group!`
        }, { quoted: fake });

    } catch (error) {
        console.error('Join command error:', error.message);
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });

        let msg = `✦ *${botName}* | Failed to join group.`;
        if (error.message?.includes('not-authorized') || error.message?.includes('forbidden')) {
            msg = `✦ *${botName}* | Not authorized or invite expired.`;
        } else if (error.message?.includes('item-not-found')) {
            msg = `✦ *${botName}* | Group not found. Check the invite link.`;
        }

        await sock.sendMessage(chatId, { text: msg }, { quoted: fake });
    }
}

module.exports = joinCommand;
