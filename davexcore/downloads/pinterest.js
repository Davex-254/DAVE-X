const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
const axios = require('axios');

async function pinterestCommand(sock, chatId, message, args) {
    const fakeContact = createFakeContact(message);
    const botName = getBotName();
    const query = args.join(' ').trim();
    
    if (!query) {
        return sock.sendMessage(chatId, { text: `*${botName} PINTEREST*\n\nUsage: .pinterest <search>\nExample: .pinterest anime wallpaper` }, { quoted: fakeContact });
    }
    
    await sock.sendMessage(chatId, { react: { text: '📌', key: message.key } });
    
    try {
        const res = await axios.get(`https://bk9.fun/search/pinterest?q=${encodeURIComponent(query)}`, { timeout: 15000 });
        const images = res.data?.BK9 || res.data?.result;
        
        if (images && Array.isArray(images) && images.length > 0) {
            const selected = images.slice(0, 5);
            for (const img of selected) {
                const imgUrl = typeof img === 'string' ? img : img.url || img.image;
                if (imgUrl) {
                    try {
                        await sock.sendMessage(chatId, { image: { url: imgUrl }, caption: `*${botName} Pinterest*\nSearch: ${query}` }, { quoted: fakeContact });
                    } catch {}
                }
            }
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        } else {
            await sock.sendMessage(chatId, { text: `*${botName}*\nNo images found for "${query}"` }, { quoted: fakeContact });
        }
    } catch (err) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nError: ${err.message}` }, { quoted: fakeContact });
    }
}

module.exports = pinterestCommand;
