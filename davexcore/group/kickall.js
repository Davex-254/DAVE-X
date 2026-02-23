const isAdmin = require('../../davelib/isAdmin');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function kickAllCommand(sock, chatId, message, senderId) {
    const fkontak = createFakeContact(message);
    
    try {
        const isGroup = chatId.endsWith('@g.us');
        if (!isGroup) {
            await sock.sendMessage(chatId, { text: 'Group command only.' }, { quoted: fkontak });
            return;
        }

        const adminStatus = await isAdmin(sock, chatId, senderId);
        const isSenderAdmin = adminStatus.isSenderAdmin;
        const isBotAdmin = adminStatus.isBotAdmin;

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: 'Bot needs admin.' }, { quoted: fkontak });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: 'Admin only command.' }, { quoted: fkontak });
            return;
        }

        const metadata = await sock.groupMetadata(chatId);
        const participants = metadata.participants || [];

        const botId = sock.user.id;
        const targets = participants
            .map(p => p.id)
            .filter(id => id !== botId && id !== senderId);

        if (targets.length === 0) {
            await sock.sendMessage(chatId, { text: 'No members.' }, { quoted: fkontak });
            return;
        }

        let kickedCount = 0;
        for (const target of targets) {
            try {
                await sock.groupParticipantsUpdate(chatId, [target], 'remove');
                kickedCount++;
                await new Promise(r => setTimeout(r, 500));
            } catch (err) {
                console.error(`Kick failed ${target}:`, err);
            }
        }

        if (kickedCount > 0) {
            await sock.sendMessage(chatId, { text: `Removed ${kickedCount} member(s).` }, { quoted: fkontak });
        } else {
            await sock.sendMessage(chatId, { text: 'No members removed.' }, { quoted: fkontak });
        }

    } catch (err) {
        console.error('KickAll error:', err);
        await sock.sendMessage(chatId, { text: 'Command failed.' }, { quoted: fkontak });
    }
}

module.exports = kickAllCommand;