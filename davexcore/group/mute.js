const isAdmin = require('../../davelib/isAdmin');
const db = require('../../Database/database');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function muteCommand(sock, chatId, senderId, message, duration) {
    const fake = createFakeContact(senderId);
    const botName = getBotName();
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        return sock.sendMessage(chatId, { text: `*${botName}*\nBot needs admin!` }, { quoted: fake });
    }

    if (!isSenderAdmin && !message?.key?.fromMe && !db.isSudo(senderId)) {
        return sock.sendMessage(chatId, { text: `*${botName}*\nAdmin only command!` }, { quoted: fake });
    }

    try {
        let groupName = "Group";
        try {
            const metadata = await sock.groupMetadata(chatId);
            groupName = metadata.subject || "Group";
        } catch (e) {
            console.error('Metadata error:', e.message);
        }

        await sock.groupSettingUpdate(chatId, 'announcement');

        if (duration && duration > 0) {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\n\n${groupName} muted for ${duration} minutes.` 
            }, { quoted: fake });

            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sock.sendMessage(chatId, { 
                        text: `*${botName}*\n\n${groupName} auto-unmuted.`
                    }, { quoted: fake });
                } catch (e) {
                    console.error('Auto-unmute error:', e.message, 'Line:', e.stack?.split('\n')[1]);
                }
            }, duration * 60 * 1000);
        } else {
            await sock.sendMessage(chatId, { 
                text: `*${botName}*\n\n${groupName} has been muted.` 
            }, { quoted: fake });
        }
    } catch (err) {
        console.error('Mute error:', err.message, 'Line:', err.stack?.split('\n')[1]);
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nFailed to mute group.` 
        }, { quoted: fake });
    }
}

module.exports = muteCommand;
