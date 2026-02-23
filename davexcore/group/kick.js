const isAdmin = require('../../davelib/isAdmin');
const db = require('../../Database/database');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function kickCommand(sock, chatId, senderId, mentionedJids, message) {
    try {
        const fake = createFakeContact(senderId);
        const botName = getBotName();

        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nGroup command only!`
            }, { quoted: fake });
            return;
        }

        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nBot needs to be admin!`
            }, { quoted: fake });
            return;
        }

        if (!isSenderAdmin && !message.key.fromMe && !db.isSudo(senderId)) {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nAdmin only command!`
            }, { quoted: fake });
            return;
        }

        let usersToKick = [];

        if (mentionedJids && mentionedJids.length > 0) {
            usersToKick = mentionedJids;
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            usersToKick = [message.message.extendedTextMessage.contextInfo.participant];
        }

        if (usersToKick.length === 0) {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nMention or reply to user(s) to kick.\n\nUsage: .kick @user`
            }, { quoted: fake });
            return;
        }

        const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';

        if (usersToKick.includes(botId) || usersToKick.includes(sock.user?.id)) {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nI cannot kick myself!`
            }, { quoted: fake });
            return;
        }

        for (const user of usersToKick) {
            const targetAdmin = await isAdmin(sock, chatId, user);
            if (targetAdmin.isSenderAdmin) {
                await sock.sendMessage(chatId, { 
                    text: `*${botName}*\nCannot kick @${user.split('@')[0]} - they are admin!`,
                    mentions: [user]
                }, { quoted: fake });
                usersToKick = usersToKick.filter(u => u !== user);
            }
        }

        if (usersToKick.length === 0) {
            return;
        }

        try {
            await sock.groupParticipantsUpdate(chatId, usersToKick, "remove");
            
            const userTags = usersToKick.map(jid => `@${jid.split('@')[0]}`).join(', ');
            
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\n\n${userTags} kicked from the group!`,
                mentions: usersToKick
            }, { quoted: fake });
        } catch (kickError) {
            console.error('Kick error:', kickError.message, 'Line:', kickError.stack?.split('\n')[1]);
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nFailed to kick user(s): ${kickError.message}`
            }, { quoted: fake });
        }
    } catch (error) {
        console.error('Error in kick command:', error.message, 'Line:', error.stack?.split('\n')[1]);
    }
}

module.exports = kickCommand;
