const axios = require('axios');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function wormgptCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    
    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text || '';
    
    const query = text.split(' ').slice(1).join(' ').trim();
    
    if (!query) {
        return sock.sendMessage(chatId, { 
            text: `*WormGPT - Uncensored AI*\n\nI am WormGPT — uncensored, fearless, and ready for anything. Ask me what you dare.\n\nExample: .wormgpt How to hack a website?` 
        }, { quoted: fake });
    }

    try {
        const apiUrl = `https://z7.veloria.my.id/ai/wormgpt?text=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.data || !response.data.status || !response.data.result) {
            throw new Error('Invalid API response');
        }

        const answer = response.data.result.trim();

        await sock.sendMessage(chatId, { text: `${answer}\n\n- DAVE X` }, { quoted: fake });

    } catch (error) {
        console.error("WormGPT Error:", error);

        let errorMessage = "Failed to get response from WormGPT.";

        if (error.response?.status === 404) {
            errorMessage += " API endpoint not found.";
        } else if (error.response?.status === 429) {
            errorMessage += " Rate limit exceeded.";
        } else if (error.message.includes("timeout")) {
            errorMessage += " Request timed out.";
        } else if (error.message.includes("ENOTFOUND")) {
            errorMessage += " Cannot connect to API server.";
        } else {
            errorMessage += " " + error.message;
        }

        await sock.sendMessage(chatId, { text: `*ERROR*\n${errorMessage}\n\n- DAVE X` }, { quoted: fake });
    }
}

module.exports = wormgptCommand;