const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
const axios = require('axios');

async function dalleCommand(sock, chatId, message, args) {
    const fakeContact = createFakeContact(message);
    const botName = getBotName();
    const prompt = args.join(' ').trim();
    
    if (!prompt) {
        return sock.sendMessage(chatId, { text: `*${botName} DALL-E*\n\nUsage: .dalle <prompt>\nExample: .dalle a cat wearing sunglasses` }, { quoted: fakeContact });
    }
    
    await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });
    await sock.sendMessage(chatId, { text: `*${botName}*\nGenerating image: "${prompt}"...` }, { quoted: fakeContact });
    
    try {
        const apis = [
            `https://bk9.fun/ai/magicstudio?prompt=${encodeURIComponent(prompt)}`,
            `https://api.siputzx.my.id/api/ai/text2img?prompt=${encodeURIComponent(prompt)}`,
        ];
        
        for (const url of apis) {
            try {
                const res = await axios.get(url, { timeout: 30000 });
                const imgUrl = res.data?.BK9 || res.data?.result || res.data?.data?.url || res.data?.url;
                if (imgUrl) {
                    await sock.sendMessage(chatId, { image: { url: imgUrl }, caption: `*${botName} DALL-E*\nPrompt: ${prompt}` }, { quoted: fakeContact });
                    await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
                    return;
                }
            } catch {}
        }
        await sock.sendMessage(chatId, { text: `*${botName}*\nFailed to generate image. Try again.` }, { quoted: fakeContact });
    } catch (err) {
        await sock.sendMessage(chatId, { text: `*${botName}*\nError: ${err.message}` }, { quoted: fakeContact });
    }
}

module.exports = dalleCommand;
