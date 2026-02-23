const isAdmin = require('../../davelib/isAdmin');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function resolveToPhone(sock, jid) {
    if (!jid) return 'unknown';
    const raw = jid.split('@')[0].split(':')[0];
    if (/^\d{7,15}$/.test(raw)) return raw;
    try {
        if (sock?.signalRepository?.lidMapping?.getPNForLID) {
            const formats = [jid, `${raw}:0@lid`, `${raw}@lid`];
            for (const fmt of formats) {
                try {
                    const pn = await sock.signalRepository.lidMapping.getPNForLID(fmt);
                    if (pn) {
                        const num = String(pn).split('@')[0].replace(/[^0-9]/g, '');
                        if (num.length >= 7 && num.length <= 15 && num !== raw) return num;
                    }
                } catch {}
            }
        }
        const groups = await sock.groupFetchAllParticipating();
        for (const gid of Object.keys(groups)) {
            for (const p of (groups[gid].participants || [])) {
                const pid = (p.id || '').split('@')[0].split(':')[0];
                const pLid = (p.lid || '').split('@')[0].split(':')[0];
                if ((pLid === raw || pid === raw) && pid && /^\d{7,15}$/.test(pid) && pid !== raw) return pid;
            }
        }
    } catch {}
    return raw;
}

async function tagNotAdminCommand(sock, chatId, senderId, message) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        const fake = createFakeContact(senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: 'Please make the bot an admin first.' }, { quoted: fake });
            return;
        }

        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: 'Only admins can use the .tagnotadmin command.' }, { quoted: fake });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];

        const nonAdmins = participants.filter(p => !p.admin).map(p => p.id);
        if (nonAdmins.length === 0) {
            await sock.sendMessage(chatId, { text: 'No non-admin members to tag.' }, { quoted: fake });
            return;
        }

        let profilePicUrl;
        try {
            profilePicUrl = await sock.profilePictureUrl(chatId, 'image');
        } catch (error) {
            profilePicUrl = null;
        }

        let text = `🏷️ *Tagging Non-Admins in ${groupMetadata.subject}*\n\n`;
        text += `📊 *Total Non-Admins:* ${nonAdmins.length}\n\n`;
        text += '🔊 *Hello Everyone:*\n\n';
        
        for (const jid of nonAdmins) {
            const resolved = await resolveToPhone(sock, jid);
            text += `@${resolved}\n`;
        }

        if (profilePicUrl) {
            await sock.sendMessage(chatId, {
                image: { url: profilePicUrl },
                caption: text,
                mentions: nonAdmins
            }, { quoted: fake });
        } else {
            await sock.sendMessage(chatId, { 
                text, 
                mentions: nonAdmins 
            }, { quoted: fake });
        }
    } catch (error) {
        console.error('Error in tagnotadmin command:', error);
        const fake = createFakeContact(senderId);
        await sock.sendMessage(chatId, { text: 'Failed to tag non-admin members.' }, { quoted: fake });
    }
}

module.exports = tagNotAdminCommand;
