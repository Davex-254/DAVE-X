const axios = require('axios');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function birdCommand(sock, chatId, message) {
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
                text: `✦ *${botName}* Bard AI\n\nUse: .bard <question>\nExample: .bard what is AI`
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

        // Fetch AI response using Bard API
        const apiUrl = `https://apiskeith.top/ai/bard?q=${encodeURIComponent(query)}`;
        const response = await axios.get(apiUrl, { timeout: 30000 });
        const apiData = response.data;

        if (!apiData?.status || !apiData?.result) {
            throw new Error("API failed to generate response!");
        }

        // Send success reaction
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

        // Format and send response
        const aiResponse = apiData.result.trim();
        
        await sock.sendMessage(chatId, {
            text: `✦ *${botName}* - am know invisible 🔥

✦ Question: ${query}

✦ ${aiResponse}`
        }, { quoted: fake });

        // Send final reaction
        await sock.sendMessage(chatId, {
            react: { text: '📤', key: message.key }
        });

    } catch (error) {
        console.error("Bard AI command error:", error);
        
        // Send error reaction
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

module.exports = birdCommand;