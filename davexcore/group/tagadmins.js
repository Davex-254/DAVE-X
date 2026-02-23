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

async function tagAdminsCommand(sock, chatId, senderId, message, fullArgs) {
    try {
        const meta = await sock.groupMetadata(chatId);
        const participants = meta.participants;
        const botName = getBotName();
        const fake = createFakeContact(message);

        const superAdmins = [];
        const admins = [];

        for (const p of participants) {
            if (p.admin === 'superadmin') {
                superAdmins.push(p.id);
            } else if (p.admin === 'admin') {
                admins.push(p.id);
            }
        }

        const allAdmins = [...superAdmins, ...admins];

        if (allAdmins.length === 0) {
            await sock.sendMessage(chatId, { text: 'No admins found in this group!' }, { quoted: fake });
            return;
        }

        const mentions = [...allAdmins, senderId];

        let text = `*${botName} TAG ADMINS*\n\n`;

        if (fullArgs && fullArgs.trim()) {
            text += `*Message:* ${fullArgs.trim()}\n\n`;
        }

        const resolvedSender = await resolveToPhone(sock, senderId);
        text += `*Tagged By:* @${resolvedSender}\n\n`;
        text += `*Admins:*\n`;

        for (const id of superAdmins) {
            const resolved = await resolveToPhone(sock, id);
            text += `@${resolved}\n`;
        }
        for (const id of admins) {
            const resolved = await resolveToPhone(sock, id);
            text += `@${resolved}\n`;
        }

        await sock.sendMessage(chatId, {
            text: text.trim(),
            mentions
        }, { quoted: fake });
    } catch (error) {
        console.error('Tagadmins error:', error);
        await sock.sendMessage(chatId, { text: `Failed to tag admins: ${error.message}` });
    }
}

module.exports = tagAdminsCommand;
