const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const db = require('../../Database/database');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function ensureGroupAndAdmin(sock, chatId, senderId, message) {
    const isGroup = chatId.endsWith('@g.us');
    if (!isGroup) {
        return { ok: false };
    }
    const isAdmin = require('../../davelib/isAdmin');
    const adminStatus = await isAdmin(sock, chatId, senderId);
    if (!adminStatus.isBotAdmin) {
        return { ok: false };
    }
    if (!adminStatus.isSenderAdmin && !message?.key?.fromMe && !db.isSudo(senderId)) {
        return { ok: false };
    }
    return { ok: true };
}

async function setGroupDescription(sock, chatId, senderId, text, message) {
    const fake = createFakeContact(senderId);
    const botName = getBotName();
    const check = await ensureGroupAndAdmin(sock, chatId, senderId, message);
    if (!check.ok) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nAdmin only command!` }, { quoted: fake });
        return;
    }
    const desc = (text || '').trim();
    if (!desc) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nUsage: .setgdesc <text>` }, { quoted: fake });
        return;
    }
    try {
        await sock.groupUpdateDescription(chatId, desc);
        await sock.sendMessage(chatId, { text: `*${botName}*\nGroup description updated!` }, { quoted: fake });
    } catch (error) {
        console.error('Set group description error:', error.message, 'Line:', error.stack?.split('\n')[1]);
        await sock.sendMessage(chatId, { text: `*${botName}*\nFailed to update description` }, { quoted: fake });
    }
}

async function setGroupName(sock, chatId, senderId, text, message) {
    const fake = createFakeContact(senderId);
    const botName = getBotName();
    const check = await ensureGroupAndAdmin(sock, chatId, senderId, message);
    if (!check.ok) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nAdmin only command!` }, { quoted: fake });
        return;
    }
    const name = (text || '').trim();
    if (!name) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nUsage: .setgname <name>` }, { quoted: fake });
        return;
    }
    try {
        await sock.groupUpdateSubject(chatId, name);
        await sock.sendMessage(chatId, { text: `*${botName}*\nGroup name updated!` }, { quoted: fake });
    } catch (error) {
        console.error('Set group name error:', error.message, 'Line:', error.stack?.split('\n')[1]);
        await sock.sendMessage(chatId, { text: `*${botName}*\nFailed to update name` }, { quoted: fake });
    }
}

async function setGroupIcon(sock, chatId, senderId, quotedMessage, message) {
    const fake = createFakeContact(senderId);
    const botName = getBotName();
    const check = await ensureGroupAndAdmin(sock, chatId, senderId, message);
    if (!check.ok) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nAdmin only command!` }, { quoted: fake });
        return;
    }
    if (!quotedMessage?.imageMessage) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nReply to an image to set as group icon` }, { quoted: fake });
        return;
    }
    try {
        const stream = await downloadContentFromMessage(quotedMessage.imageMessage, 'image');
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
        }
        await sock.updateProfilePicture(chatId, buffer);
        await sock.sendMessage(chatId, { text: `*${botName}*\nGroup icon updated!` }, { quoted: fake });
    } catch (error) {
        console.error('Set group icon error:', error.message, 'Line:', error.stack?.split('\n')[1]);
        await sock.sendMessage(chatId, { text: `*${botName}*\nFailed to update icon` }, { quoted: fake });
    }
}

async function groupLink(sock, chatId, senderId, message) {
    const fake = createFakeContact(senderId);
    const botName = getBotName();
    const check = await ensureGroupAndAdmin(sock, chatId, senderId, message);
    if (!check.ok) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nAdmin only command!` }, { quoted: fake });
        return;
    }
    try {
        const code = await sock.groupInviteCode(chatId);
        await sock.sendMessage(chatId, { text: `*${botName}*\n\nGroup Link:\nhttps://chat.whatsapp.com/${code}` }, { quoted: fake });
    } catch (error) {
        console.error('Group link error:', error.message, 'Line:', error.stack?.split('\n')[1]);
        await sock.sendMessage(chatId, { text: `*${botName}*\nFailed to get link` }, { quoted: fake });
    }
}

async function revokeGroupLink(sock, chatId, senderId, message) {
    const fake = createFakeContact(senderId);
    const botName = getBotName();
    const check = await ensureGroupAndAdmin(sock, chatId, senderId, message);
    if (!check.ok) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nAdmin only command!` }, { quoted: fake });
        return;
    }
    try {
        await sock.groupRevokeInvite(chatId);
        await sock.sendMessage(chatId, { text: `*${botName}*\nGroup link revoked!` }, { quoted: fake });
    } catch (error) {
        console.error('Revoke link error:', error.message, 'Line:', error.stack?.split('\n')[1]);
        await sock.sendMessage(chatId, { text: `*${botName}*\nFailed to revoke link` }, { quoted: fake });
    }
}

module.exports = {
    setGroupDescription,
    setGroupName,
    setGroupIcon,
    groupLink,
    revokeGroupLink
};
