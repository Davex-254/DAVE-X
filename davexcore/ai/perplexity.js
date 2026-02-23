const axios = require('axios');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function perplexityCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    
    try {
        // Send initial reaction
        await sock.sendMessage(chatId, {
            react: { text: '⏳', key: message.key }
        });

        const text = message.message?.conversation || 
                     message.message?.extendedTextMessage?.text || 
                     message.message?.imageMessage?.caption || 
                     '';
        
        if (!text.includes(' ')) {
            return await sock.sendMessage(chatId, {
                text: `✦ *${botName}* Perplexity AI\n\nUse: .perplexity <question>\nExample: .perplexity what is AI`
            }, { quoted: fake });
        }

        const parts = text.split(' ');
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `✦ *${botName}*\nProvide a question`
            }, { quoted: fake });
        }

        if (query.length > 1000) {
            return await sock.sendMessage(chatId, {
                text: `✦ *${botName}*\nQuestion too long (max 1000 chars)`
            }, { quoted: fake });
        }

        // Update presence to "typing"
        await sock.sendPresenceUpdate('composing', chatId);

        // Fetch AI response using Perplexity API
        const apiUrl = `https://apiskeith.top/ai/perplexity?q=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const apiData = response.data;

        if (!apiData?.status || !apiData?.result) {
            throw new Error("Perplexity AI failed to generate response!");
        }

        // Send success reaction
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

        // Send clean response with signature
        const aiResponse = apiData.result.trim();
        await sock.sendMessage(chatId, { 
            text: `✦ *${botName}* - am know invisible 🔥\n\n${aiResponse}` 
        }, { quoted: fake });

        // Final reaction
        await sock.sendMessage(chatId, {
            react: { text: '📚', key: message.key }
        });

    } catch (error) {
        console.error("Perplexity AI command error:", error);

        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });

        let errorMessage = "✦ Failed to generate response";
        
        if (error.response?.status === 404) {
            errorMessage = '✦ Service unavailable';
        } else if (error.message.includes('timeout') || error.code === 'ECONNABORTED') {
            errorMessage = '✦ Request timeout';
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = '✦ Network error';
        } else if (error.response?.status === 429) {
            errorMessage = '✦ Too many requests';
        } else if (error.response?.status >= 500) {
            errorMessage = '✦ Server error';
        }

        await sock.sendMessage(chatId, {
            text: errorMessage
        }, { quoted: fake });
    }
}

module.exports = perplexityCommand;