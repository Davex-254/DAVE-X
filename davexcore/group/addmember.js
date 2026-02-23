const isAdmin = require('../../davelib/isAdmin');
const db = require('../../Database/database');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function addMemberCommand(sock, chatId, message, text) {
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

        if (!text || text.trim() === '') {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nUsage: .add 6281234567890\n(Include country code, no + sign)`
            }, { quoted: fake });
            return;
        }

        const phoneNumber = text.replace(/[^0-9]/g, '');
        if (!phoneNumber) {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\nInvalid phone number!`
            }, { quoted: fake });
            return;
        }

        const userJid = phoneNumber + '@s.whatsapp.net';

        try {
            const result = await sock.groupParticipantsUpdate(chatId, [userJid], 'add');
            
            if (result && result[0] && result[0].status === 200) {
                await sock.sendMessage(chatId, { 
                    text: `*${botName}*\n\n+${phoneNumber} added to the group!`
                }, { quoted: fake });
                return;
            }

            const groupMetadata = await sock.groupMetadata(chatId);
            const inviteCode = await sock.groupInviteCode(chatId);
            const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
            
            try {
                await sock.sendMessage(userJid, {
                    text: `Hello! You're invited to join:\n\n*${groupMetadata.subject}*\n\n${inviteLink}\n\nInvited by: ${message.pushName || 'Admin'}`
                });
                
                await sock.sendMessage(chatId, {
                    text: `*${botName}*\n\nInvite sent to +${phoneNumber}`
                }, { quoted: fake });
            } catch (inviteError) {
                await sock.sendMessage(chatId, {
                    text: `*${botName}*\n\nGroup link:\n${inviteLink}\n\nShare with +${phoneNumber}`
                }, { quoted: fake });
            }

        } catch (error) {
            console.error('Add member error:', error.message, 'Line:', error.stack?.split('\n')[1]);
            
            try {
                const inviteCode = await sock.groupInviteCode(chatId);
                const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;
                
                await sock.sendMessage(chatId, {
                    text: `*${botName}*\n\nFailed to add. Share this link:\n${inviteLink}`
                }, { quoted: fake });
            } catch (linkError) {
                await sock.sendMessage(chatId, {
                    text: `*${botName}*\nFailed to add member.`
                }, { quoted: fake });
            }
        }

    } catch (error) {
        console.error('Error in add command:', error.message, 'Line:', error.stack?.split('\n')[1]);
    }
}

module.exports = { addMemberCommand };
