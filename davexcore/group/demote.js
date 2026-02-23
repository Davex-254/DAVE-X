const isAdmin = require('../../davelib/isAdmin');
const db = require('../../Database/database');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function demoteCommand(sock, chatId, mentionedJids, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const fake = createFakeContact(senderId);
    const botName = getBotName();

    try {
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

        let userToDemote = [];

        if (mentionedJids && mentionedJids.length > 0) {
            userToDemote = mentionedJids;
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToDemote = [message.message.extendedTextMessage.contextInfo.participant];
        }

        if (userToDemote.length === 0) {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nMention or reply to demote!`
            }, { quoted: fake });
            return;
        }

        const botJid = sock.user?.id?.split(':')[0];

        const filteredUsersToDemote = userToDemote.filter(jid => {
            const cleanJid = jid.split(':')[0];
            return cleanJid !== botJid;
        });

        if (filteredUsersToDemote.length === 0) {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nCannot demote the bot!`
            }, { quoted: fake });
            return;
        }

        await sock.groupParticipantsUpdate(chatId, filteredUsersToDemote, "demote");

        const usernames = filteredUsersToDemote.map(jid => `@${jid.split('@')[0]}`).join(', ');

        await sock.sendMessage(chatId, { 
            text: `*${botName}*\n\nDemoted: ${usernames}`,
            mentions: filteredUsersToDemote
        }, { quoted: fake });
    } catch (error) {
        console.error('Error in demote command:', error.message, 'Line:', error.stack?.split('\n')[1]);
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nFailed to demote.`
        }, { quoted: fake });
    }
}

async function handleDemotionEvent(sock, groupId, participants, author) {
    try {
        if (!Array.isArray(participants) || participants.length === 0) return;

        const botJid = sock.user?.id?.split(':')[0];

        const filteredParticipants = participants.filter(jid => {
            const jidString = typeof jid === 'string' ? jid : (jid.id || jid.toString());
            const cleanJid = jidString.split(':')[0];
            return cleanJid !== botJid;
        });

        if (filteredParticipants.length === 0) return;

        const isBotAction = author && (author === botJid || author.includes(botJid));
        if (!isBotAction) return;

        const botName = getBotName();
        const demotedUsernames = filteredParticipants.map(jid => {
            const jidString = typeof jid === 'string' ? jid : (jid.id || jid.toString());
            return `@${jidString.split('@')[0]}`;
        }).join(', ');

        const mentionList = filteredParticipants.map(jid => {
            return typeof jid === 'string' ? jid : (jid.id || jid.toString());
        });

        await sock.sendMessage(groupId, {
            text: `*${botName}*\n\nDemoted: ${demotedUsernames}`,
            mentions: mentionList
        });
    } catch (error) {
        console.error('Error handling demotion event:', error.message, 'Line:', error.stack?.split('\n')[1]);
    }
}

module.exports = { demoteCommand, handleDemotionEvent };
