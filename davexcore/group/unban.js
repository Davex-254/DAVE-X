const db = require('../../Database/database');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function unbanCommand(sock, chatId, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const fake = createFakeContact(senderId);
    const botName = getBotName();
    
    if (!message.key.fromMe && !db.isSudo(senderId)) {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nOwner only command!`
        }, { quoted: fake });
        return;
    }

    let userToUnban;
    
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToUnban = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToUnban = message.message.extendedTextMessage.contextInfo.participant;
    } else {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const args = text.split(' ').slice(1);
        if (args.length > 0) {
            const possibleJid = args[0];
            if (possibleJid.includes('@')) {
                userToUnban = possibleJid;
            } else {
                userToUnban = possibleJid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            }
        }
    }
    
    if (!userToUnban) {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nMention, reply, or provide number to unban!\n\nExample: .unban @user or .unban 6281234567890`
        }, { quoted: fake });
        return;
    }

    try {
        if (db.isBanned(userToUnban)) {
            db.removeBannedUser(userToUnban);
            
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\n\n@${userToUnban.split('@')[0]} has been unbanned!`,
                mentions: [userToUnban]
            }, { quoted: fake });
        } else {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\n\n@${userToUnban.split('@')[0]} is not banned!`,
                mentions: [userToUnban]
            }, { quoted: fake });
        }
    } catch (error) {
        console.error('Error in unban command:', error.message, 'Line:', error.stack?.split('\n')[1]);
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nFailed to unban user!`
        }, { quoted: fake });
    }
}

module.exports = unbanCommand;
