const db = require('../../Database/database');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function broadcastCommand(sock, chatId, message) {
    const senderId = message.key.participant || message.key.remoteJid;
    const fake = createFakeContact(senderId);
    const botName = getBotName();
    
    if (!message.key.fromMe && !db.isSudo(senderId)) {
        return sock.sendMessage(chatId, { 
            text: `*${botName}*\nOwner only command!`
        }, { quoted: fake });
    }

    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text || '';
    
    const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    
    if (!text && !quotedMessage?.imageMessage) {
        return sock.sendMessage(chatId, { 
            text: `*${botName}*\nReply to image or type text to broadcast`
        }, { quoted: fake });
    }

    try {
        const groups = Object.keys(await sock.groupFetchAllParticipating());
        
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\n\nBroadcasting to ${groups.length} groups...`
        }, { quoted: fake });

        const channelInfo = {};

        const broadcastText = `*${botName} Broadcast*\n\n${text}`;

        let successCount = 0;
        let failCount = 0;

        for (let groupId of groups) {
            try {
                await new Promise(resolve => setTimeout(resolve, 1500));

                if (quotedMessage?.imageMessage) {
                    await sock.sendMessage(groupId, {
                        image: quotedMessage.imageMessage,
                        caption: broadcastText,
                        ...channelInfo
                    });
                } else {
                    await sock.sendMessage(groupId, {
                        text: broadcastText,
                        ...channelInfo
                    });
                }
                successCount++;
            } catch (e) {
                failCount++;
            }
        }

        await sock.sendMessage(chatId, {
            text: `*${botName}*\n\nBroadcast complete!\nSuccess: ${successCount}\nFailed: ${failCount}`
        }, { quoted: fake });

    } catch (error) {
        console.error('Broadcast error:', error.message, 'Line:', error.stack?.split('\n')[1]);
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nBroadcast failed!`
        }, { quoted: fake });
    }
}

module.exports = { broadcastCommand };
