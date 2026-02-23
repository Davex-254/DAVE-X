const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function linkgroupCommand(sock, chatId, message) {
    const fkontak = createFakeContact(message);

    // Check if it's a group
    if (!chatId.endsWith('@g.us')) {
        await sock.sendMessage(chatId, { 
            text: 'This command only works in groups.'
        }, { quoted: fkontak });
        return;
    }

    try {
        // Get sender ID from message
        const senderId = message.key.participant || message.key.remoteJid;
        
        // Check if user is owner
        const isOwner = message.key.fromMe;
        
        if (!isOwner) {
            const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { 
                    text: 'Bot needs admin permissions to get group link.'
                }, { quoted: fkontak });
                return;
            }

            if (!isSenderAdmin) {
                await sock.sendMessage(chatId, { 
                    text: 'This command requires admin privileges.'
                }, { quoted: fkontak });
                return;
            }
        }

        // Get invite code and group metadata
        const code = await sock.groupInviteCode(chatId);
        const metadata = await sock.groupMetadata(chatId);

        // Send the link
        await sock.sendMessage(chatId, { 
            text: `*Group Invite Link*\n\nhttps://chat.whatsapp.com/${code}\n\nGroup: ${metadata.subject}\nMembers: ${metadata.participants.length}\n\n- DAVE X`
        }, { quoted: fkontak });

    } catch (error) {
        console.error('Error in linkgroup command:', error);
        
        let errorMsg = 'Failed to get group link.';
        
        if (error.message?.includes('not-authorized') || error.message?.includes('forbidden')) {
            errorMsg = 'Bot needs admin permissions to get group link.';
        }
        
        await sock.sendMessage(chatId, { 
            text: errorMsg
        }, { quoted: fkontak });
    }
}

module.exports = linkgroupCommand;