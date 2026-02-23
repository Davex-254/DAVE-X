const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
const axios = require('axios');

async function logoCommand(sock, chatId, message, args) {
    const fakeContact = createFakeContact(message);
    const botName = getBotName();
    const text = args.join(' ').trim();
    
    if (!text) {
        return sock.sendMessage(chatId, { text: `*${botName} LOGO MAKER*\n\nUsage: .logo <text>\nMakes a styled logo from your text` }, { quoted: fakeContact });
    }
    
    await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });
    
    try {
        const res = await axios.get(`https://api.siputzx.my.id/api/m/ephoto?url=https://en.ephoto360.com/create-3d-hologram-text-effect-online-free-697.html&text=${encodeURIComponent(text)}`, { timeout: 20000 });
        const imgUrl = res.data?.result || res.data?.url || res.data?.data?.url;
        if (imgUrl) {
            await sock.sendMessage(chatId, { image: { url: imgUrl }, caption: `*${botName} LOGO*\nText: ${text}` }, { quoted: fakeContact });
        } else {
            await sock.sendMessage(chatId, { text: `*${botName}*\nFailed to generate logo.` }, { quoted: fakeContact });
        }
    } catch (err) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nError: ${err.message}` }, { quoted: fakeContact });
    }
}

async function carbonCommand(sock, chatId, message, args) {
    const fakeContact = createFakeContact(message);
    const botName = getBotName();
    const code = args.join(' ').trim();
    
    if (!code) {
        return sock.sendMessage(chatId, { text: `*${botName} CARBON*\n\nUsage: .carbon <code>\nGenerates a beautiful code screenshot` }, { quoted: fakeContact });
    }
    
    await sock.sendMessage(chatId, { react: { text: '💻', key: message.key } });
    
    try {
        const res = await axios.get(`https://bk9.fun/tools/carbon?q=${encodeURIComponent(code)}`, { timeout: 20000 });
        const imgUrl = res.data?.BK9 || res.data?.result;
        if (imgUrl) {
            await sock.sendMessage(chatId, { image: { url: imgUrl }, caption: `*${botName} CARBON*` }, { quoted: fakeContact });
        } else {
            await sock.sendMessage(chatId, { text: `*${botName}*\nFailed to generate carbon image.` }, { quoted: fakeContact });
        }
    } catch (err) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nError: ${err.message}` }, { quoted: fakeContact });
    }
}

module.exports = { logoCommand, carbonCommand };
