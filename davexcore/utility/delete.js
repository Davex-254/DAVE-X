const isAdmin = require('../../davelib/isAdmin');
const store = require('../../davelib/lightweight_store');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function deleteCommand(sock, chatId, message, senderId) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    
    try {
        const isGroup = chatId.endsWith('@g.us');
        let isSenderAdmin = true;
        let isBotAdmin = true;

        if (isGroup) {
            const adminStatus = await isAdmin(sock, chatId, senderId);
            isSenderAdmin = adminStatus.isSenderAdmin;
            isBotAdmin = adminStatus.isBotAdmin;

            if (!isBotAdmin) {
                await sock.sendMessage(chatId, { 
                    text: `✦ Bot needs to be admin` 
                }, { quoted: fake });
                return;
            }

            if (!isSenderAdmin && !message.key.fromMe) {
                await sock.sendMessage(chatId, { 
                    text: `✦ Admin only command` 
                }, { quoted: fake });
                return;
            }
        } else {
            // Private chat: only allow if sender is the chat owner
            if (senderId !== chatId && !message.key.fromMe) {
                await sock.sendMessage(chatId, { 
                    text: `✦ Only chat owner can delete` 
                }, { quoted: fake });
                return;
            }
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const parts = text.trim().split(/\s+/);
        let countArg = 1;
        if (parts.length > 1) {
            const maybeNum = parseInt(parts[1], 10);
            if (!isNaN(maybeNum) && maybeNum > 0) countArg = Math.min(maybeNum, 20);
        }

        const ctxInfo = message.message?.extendedTextMessage?.contextInfo || {};
        const mentioned = Array.isArray(ctxInfo.mentionedJid) && ctxInfo.mentionedJid.length > 0 ? ctxInfo.mentionedJid[0] : null;
        const repliedParticipant = ctxInfo.participant || null;
        const repliedMsgId = ctxInfo.stanzaId || null;

        let targetUser = null;
        
        if (repliedParticipant && repliedMsgId) {
            targetUser = repliedParticipant;
        } else if (mentioned) {
            targetUser = mentioned;
        } else {
            targetUser = isGroup ? null : chatId;
        }

        if (!targetUser) {
            await sock.sendMessage(chatId, { 
                text: `✦ Reply to a user or mention them` 
            }, { quoted: fake });
            return;
        }

        // Get messages from store
        const chatMessages = store.messages[chatId] || [];
        if (chatMessages.length === 0) {
            await sock.sendMessage(chatId, { 
                text: `✦ No messages in store for this chat` 
            }, { quoted: fake });
            return;
        }

        const toDelete = [];
        const seenIds = new Set();

        // Add command message to deletion list (optional - remove if you don't want to delete the command)
        if (message.key?.id) {
            toDelete.push({
                key: {
                    id: message.key.id,
                    remoteJid: chatId,
                    participant: senderId,
                    fromMe: message.key.fromMe || false
                }
            });
            seenIds.add(message.key.id);
        }

        // Add replied message if exists
        if (repliedMsgId && repliedParticipant) {
            const repliedMsg = chatMessages.find(m => 
                m.key.id === repliedMsgId && 
                (m.key.participant === repliedParticipant || m.key.remoteJid === repliedParticipant)
            );
            
            if (repliedMsg && !seenIds.has(repliedMsg.key.id)) {
                toDelete.push(repliedMsg);
                seenIds.add(repliedMsg.key.id);
            } else {
                // Try direct deletion
                try {
                    await sock.sendMessage(chatId, {
                        delete: {
                            remoteJid: chatId,
                            fromMe: false,
                            id: repliedMsgId,
                            participant: repliedParticipant
                        }
                    });
                    countArg--;
                } catch (e) {}
            }
        }

        // Find messages from target user
        const userMessages = chatMessages.filter(m => {
            const participant = m.key.participant || m.key.remoteJid;
            return participant === targetUser && !seenIds.has(m.key.id) && !m.message?.protocolMessage;
        });

        // Sort by timestamp (newest first)
        userMessages.sort((a, b) => (b.messageTimestamp || 0) - (a.messageTimestamp || 0));

        // Add up to countArg messages
        for (const msg of userMessages) {
            if (toDelete.length >= countArg + 1) break;
            if (!seenIds.has(msg.key.id)) {
                toDelete.push(msg);
                seenIds.add(msg.key.id);
            }
        }

        if (toDelete.length === 0) {
            await sock.sendMessage(chatId, { 
                text: `✦ No recent messages found` 
            }, { quoted: fake });
            return;
        }

        let deletedCount = 0;
        for (const m of toDelete) {
            try {
                const msgParticipant = m.key.participant || targetUser;
                await sock.sendMessage(chatId, {
                    delete: {
                        remoteJid: chatId,
                        fromMe: m.key.fromMe || false,
                        id: m.key.id,
                        participant: msgParticipant
                    }
                });
                deletedCount++;
                await new Promise(r => setTimeout(r, 300));
            } catch (e) {
                console.error('Delete error:', e.message);
            }
        }

        // Remove command message from count in response
        const actualDeleted = deletedCount - (message.key?.id ? 1 : 0);
        
        await sock.sendMessage(chatId, { 
            text: `✦ Deleted ${actualDeleted} message${actualDeleted !== 1 ? 's' : ''}` 
        }, { quoted: fake });

    } catch (err) {
        console.error('Delete command error:', err);
        await sock.sendMessage(chatId, { 
            text: `✦ Failed to delete messages` 
        }, { quoted: fake });
    }
}

module.exports = deleteCommand;