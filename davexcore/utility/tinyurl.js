const axios = require("axios");
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function shortenUrlCommand(sock, chatId, message, text) {
    try {
        const fake = createFakeContact(message);

        // Send loading reaction
        await sock.sendMessage(chatId, { react: { text: '⏳', key: message.key } });

        if (!text) {
            await sock.sendMessage(chatId, { 
                text: '❌ You forgot the URL, genius. 🤦🏻\n\nExample: .shorten https://example.com' 
            }, { quoted: fake });
            return;
        }

        let url = text.trim();
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        const encodedUrl = encodeURIComponent(url);
        const apiUrl = `https://api.nekolabs.web.id/tools/shortlink/tinyurl?url=${encodedUrl}`;

        const response = await axios.get(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
            },
            timeout: 10000
        });

        if (!response.data?.success || !response.data?.result) {
            throw new Error('API returned invalid response');
        }

        const shortUrl = response.data.result;
        const responseTime = response.data.responseTime || 'N/A';

        const resultMessage = `✅ *URL SHORTENED SUCCESSFULLY*\n\n` +
                            `📎 *Original URL:*\n${url}\n\n` +
                            `🔗 *Shortened URL:*\n${shortUrl}\n\n` +
                            `⏱️ *Response Time:* ${responseTime}\n\n` +
                            `💡 *Tip:* Click/tap on the shortened URL to copy it`;

        await sock.sendMessage(chatId, { text: resultMessage }, { quoted: fake });

        // Send success reaction
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (error) {
        console.error('Shorten URL error:', error);
        const fake = createFakeContact(message);

        let errorMessage = "❌ Failed to shorten URL.\n\n";
        
        if (error.response?.status === 400) {
            errorMessage += "Invalid URL format. 🔗";
        } else if (error.response?.status === 429) {
            errorMessage += "Rate limit exceeded. Try again later. ⏳";
        } else if (error.message.includes('timeout')) {
            errorMessage += "API timeout. Please try again. ⏱️";
        } else if (error.message.includes('ENOTFOUND')) {
            errorMessage += "Can't reach API server. 🌐";
        } else if (error.message.includes('Invalid response')) {
            errorMessage += "API returned invalid response. 🗑️";
        } else {
            errorMessage += `Error: ${error.message}`;
        }

        await sock.sendMessage(chatId, { 
            text: errorMessage 
        }, { quoted: fake });

        // Send error reaction
        await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
    }
}

module.exports = {
    shortenUrlCommand
};