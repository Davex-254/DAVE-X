const db = require('../../Database/database');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function banCommand(sock, chatId, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const fake = createFakeContact(senderId);
    const botName = getBotName();

    if (!message.key.fromMe && !db.isSudo(senderId)) {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nOwner only command!`
        }, { quoted: fake });
        return;
    }

    let userToBan;
    
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToBan = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToBan = message.message.extendedTextMessage.contextInfo.participant;
    }
    
    if (!userToBan) {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nMention or reply to a user to ban!`
        }, { quoted: fake });
        return;
    }

    try {
        const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        if (userToBan === botId || userToBan === sock.user?.id) {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nCannot ban the bot!`
            }, { quoted: fake });
            return;
        }
    } catch {}

    try {
        if (!db.isBanned(userToBan)) {
            db.addBannedUser(userToBan);
            
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\n\n@${userToBan.split('@')[0]} has been banned!`,
                mentions: [userToBan]
            }, { quoted: fake });
        } else {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\n\n@${userToBan.split('@')[0]} is already banned!`,
                mentions: [userToBan]
            }, { quoted: fake });
        }
    } catch (error) {
        console.error('Error in ban command:', error.message, 'Line:', error.stack?.split('\n')[1]);
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nFailed to ban user!`
        }, { quoted: fake });
    }
}

module.exports = banCommand;
