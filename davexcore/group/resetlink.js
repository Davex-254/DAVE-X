const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function resetlinkCommand(sock, chatId, senderId, message) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    
    try {
        const groupMetadata = await sock.groupMetadata(chatId);

        const isAdmin = groupMetadata.participants.some(p => 
            p.id === senderId && p.admin
        );

        const botUser = sock.user || sock.state?.legacy?.user;
        let botId;

        if (botUser && botUser.id) {
            const rawId = botUser.id.includes(':') ? botUser.id.split(':')[0] : botUser.id;
            botId = `${rawId}@s.whatsapp.net`;
        } else {
            const phoneNumber = sock.authState?.creds?.me?.id || '1234567890';
            botId = `${phoneNumber.split(':')[0]}@s.whatsapp.net`;
        }

        const isBotAdmin = groupMetadata.participants.some(p => 
            p.id === botId && p.admin
        );

        if (!isAdmin) {
            await sock.sendMessage(chatId, { 
                text: `✦ *${botName}*\nAdmins only command` 
            }, { quoted: fake });
            return;
        }

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { 
                text: `✦ *${botName}*\nBot needs admin rights` 
            }, { quoted: fake });
            return;
        }

        const newCode = await sock.groupRevokeInvite(chatId);

        await sock.sendMessage(chatId, { 
            text: `✦ *${botName}*\n\nGroup link reset\n\nhttps://chat.whatsapp.com/${newCode}`
        }, { quoted: fake });

    } catch (error) {
        console.error('Resetlink Error:', error);
        await sock.sendMessage(chatId, { 
            text: `✦ *${botName}*\nFailed to reset link`
        }, { quoted: fake });
    }
}

module.exports = resetlinkCommand;