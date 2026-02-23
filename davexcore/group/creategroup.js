const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function creategroupCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    
    if (!message.key.fromMe) {
        return sock.sendMessage(chatId, { 
            text: 'Owner only command'
        }, { quoted: fake });
    }

    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text || '';
    
    const groupName = text.split(' ').slice(1).join(' ').trim();
    
    if (!groupName) {
        return sock.sendMessage(chatId, { 
            text: 'Provide group name'
        }, { quoted: fake });
    }

    try {
        const createdGroup = await sock.groupCreate(groupName, []);
        const code = await sock.groupInviteCode(createdGroup.id);
        const link = `https://chat.whatsapp.com/${code}`;

        const info = `Group created\nName: ${createdGroup.subject}\nID: ${createdGroup.id}\nOwner: @${createdGroup.owner.split("@")[0]}\nLink: ${link}`;

        await sock.sendMessage(chatId, {
            text: info,
            mentions: [createdGroup.owner]
        }, { quoted: fake });

    } catch (error) {
        console.error('Creategroup Error:', error);
        await sock.sendMessage(chatId, { 
            text: 'Failed to create group'
        }, { quoted: fake });
    }
}

module.exports = creategroupCommand;