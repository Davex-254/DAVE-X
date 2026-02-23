const isAdmin = require('../../davelib/isAdmin');
const db = require('../../Database/database');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function promoteCommand(sock, chatId, mentionedJids, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const fake = createFakeContact(senderId);
    const botName = getBotName();

    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nGroup command only!`
        }, { quoted: fake });
        return;
    }

    const adminStatus = await isAdmin(sock, chatId, senderId);

    if (!adminStatus.isBotAdmin) {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nBot needs admin!`
        }, { quoted: fake });
        return;
    }

    if (!adminStatus.isSenderAdmin && !message.key.fromMe && !db.isSudo(senderId)) {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nAdmin only command!`
        }, { quoted: fake });
        return;
    }
    
    let userToPromote = [];

    if (mentionedJids?.length > 0) {
        userToPromote = mentionedJids;
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
    }

    if (userToPromote.length === 0) {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nMention or reply to promote.`
        }, { quoted: fake });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, userToPromote, "promote");

        const promotedUsers = userToPromote.map(jid => `@${jid.split('@')[0]}`).join(', ');

        await sock.sendMessage(chatId, { 
            text: `*${botName}*\n\nPromoted: ${promotedUsers}`,
            mentions: userToPromote
        }, { quoted: fake });
    } catch (error) {
        console.error('Promote error:', error.message, 'Line:', error.stack?.split('\n')[1]);
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nFailed to promote.`
        }, { quoted: fake });
    }
}

async function handlePromotionEvent(sock, groupId, participants, author) {
    try {
        if (!Array.isArray(participants) || participants.length === 0) return;

        const botJid = sock.user?.id;
        const authorJid = typeof author === 'string' ? author : (author?.id || '');

        if (authorJid !== botJid) return;

        const botName = getBotName();
        const promotedUsers = participants.map(jid => {
            const jidString = typeof jid === 'string' ? jid : (jid.id || '');
            return `@${jidString.split('@')[0]}`;
        }).join(', ');

        const mentionList = participants.map(jid => 
            typeof jid === 'string' ? jid : (jid.id || '')
        );

        await sock.sendMessage(groupId, {
            text: `*${botName}*\n\nPromoted: ${promotedUsers}`,
            mentions: mentionList
        });
    } catch (error) {
        console.error('Promotion event error:', error.message, 'Line:', error.stack?.split('\n')[1]);
    }
}

module.exports = { promoteCommand, handlePromotionEvent };
