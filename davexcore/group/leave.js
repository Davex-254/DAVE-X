const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function leaveGroupCommand(sock, chatId, message) {
    const fkontak = createFakeContact(message);
    
    try {
        const isOwner = message.key.fromMe;
        if (!isOwner) {
            await sock.sendMessage(chatId, { 
                text: 'Owner only.'
            }, { quoted: fkontak });
            return;
        }

        const chat = await sock.groupMetadata(chatId).catch(() => null);
        if (!chat) {
            await sock.sendMessage(chatId, { 
                text: 'Group only.'
            }, { quoted: fkontak });
            return;
        }

        const groupName = chat.subject || 'group';
        
        await sock.sendMessage(chatId, { 
            text: `Leaving ${groupName}.`
        }, { quoted: fkontak });
        
        await sock.groupLeave(chatId);

        console.log(`Left group: ${groupName}`);

    } catch (error) {
        console.error('Leave error:', error);
    }
}

module.exports = leaveGroupCommand;