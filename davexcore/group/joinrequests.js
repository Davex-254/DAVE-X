const { getBotName, createFakeContact } = require('../../davelib/fakeContact');

async function acceptCommand(sock, chatId, senderId, args, message, fake) {
    const botName = getBotName();
    try {
        if (!chatId.endsWith('@g.us')) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | This command only works in groups.`
            }, { quoted: fake });
        }

        const pendingRequests = await sock.groupRequestParticipantsList(chatId);

        if (!pendingRequests || pendingRequests.length === 0) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | No pending join requests in this group.`
            }, { quoted: fake });
        }

        if (args && args.trim()) {
            const number = args.replace(/[^0-9]/g, '');
            const userJid = `${number}@s.whatsapp.net`;
            const isPending = pendingRequests.some(r => r.jid === userJid || r.jid.startsWith(number));
            if (!isPending) {
                return sock.sendMessage(chatId, {
                    text: `✦ *${botName}* | No pending request found for +${number}.`
                }, { quoted: fake });
            }
            await sock.groupRequestParticipantsUpdate(chatId, [userJid], 'approve');
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | ✅ Approved @${number}'s join request!`,
                mentions: [userJid]
            }, { quoted: fake });
        }

        const jids = pendingRequests.map(r => r.jid);
        await sock.groupRequestParticipantsUpdate(chatId, jids, 'approve');

        const names = pendingRequests.slice(0, 10).map(r => `+${r.jid.split('@')[0]}`).join(', ');
        const extra = jids.length > 10 ? ` and ${jids.length - 10} more` : '';

        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | ✅ Approved *${jids.length}* pending request(s)!\n\n${names}${extra}`
        }, { quoted: fake });

    } catch (error) {
        console.error('acceptCommand error:', error.message);
        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | ❌ Failed to approve: ${error.message}`
        }, { quoted: fake });
    }
}

async function rejectCommand(sock, chatId, senderId, args, message, fake) {
    const botName = getBotName();
    try {
        if (!chatId.endsWith('@g.us')) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | This command only works in groups.`
            }, { quoted: fake });
        }

        const pendingRequests = await sock.groupRequestParticipantsList(chatId);

        if (!pendingRequests || pendingRequests.length === 0) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | No pending join requests in this group.`
            }, { quoted: fake });
        }

        if (args && args.trim()) {
            const number = args.replace(/[^0-9]/g, '');
            const userJid = `${number}@s.whatsapp.net`;
            const isPending = pendingRequests.some(r => r.jid === userJid || r.jid.startsWith(number));
            if (!isPending) {
                return sock.sendMessage(chatId, {
                    text: `✦ *${botName}* | No pending request found for +${number}.`
                }, { quoted: fake });
            }
            await sock.groupRequestParticipantsUpdate(chatId, [userJid], 'reject');
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | ❌ Rejected @${number}'s join request.`,
                mentions: [userJid]
            }, { quoted: fake });
        }

        const jids = pendingRequests.map(r => r.jid);
        await sock.groupRequestParticipantsUpdate(chatId, jids, 'reject');

        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | ❌ Rejected all *${jids.length}* pending request(s).`
        }, { quoted: fake });

    } catch (error) {
        console.error('rejectCommand error:', error.message);
        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | ❌ Failed to reject: ${error.message}`
        }, { quoted: fake });
    }
}

async function acceptAllCommand(sock, chatId, senderId, message, fake) {
    return acceptCommand(sock, chatId, senderId, '', message, fake);
}

async function rejectAllCommand(sock, chatId, senderId, message, fake) {
    return rejectCommand(sock, chatId, senderId, '', message, fake);
}

async function listRequestsCommand(sock, chatId, senderId, message, fake) {
    const botName = getBotName();
    try {
        const pendingRequests = await sock.groupRequestParticipantsList(chatId);

        if (!pendingRequests || pendingRequests.length === 0) {
            return sock.sendMessage(chatId, {
                text: `✦ *${botName}* | No pending join requests.`
            }, { quoted: fake });
        }

        const requestList = pendingRequests.map((r, i) => {
            const number = r.jid.split('@')[0];
            return `${i + 1}. @${number}`;
        }).join('\n');

        const mentions = pendingRequests.map(r => r.jid);

        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | Pending Join Requests\n\nTotal: *${pendingRequests.length}*\n\n${requestList}\n\n_Use .accept or .acceptall to approve all_\n_Use .accept <number> to approve one_`,
            mentions
        }, { quoted: fake });
    } catch (error) {
        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* | ❌ Failed to list requests: ${error.message}`
        }, { quoted: fake });
    }
}

module.exports = {
    acceptCommand,
    rejectCommand,
    acceptAllCommand,
    rejectAllCommand,
    listRequestsCommand,
};
