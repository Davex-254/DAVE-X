const axios = require('axios');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

/**
 * Weather Command Handler
 * @param {object} sock - WhatsApp socket
 * @param {string} chatId - Chat ID
 * @param {object} message - Message object
 */
async function weatherCommand(sock, chatId, message) {
    try {
        // Extract text from message
        const text = extractMessageText(message);
        
        if (!text) {
            return await sendPromptMessage(sock, chatId, message);
        }

        // Parse command and query
        const { command, query } = parseCommand(text);
        
        if (!query) {
            return await sendEmptyQueryMessage(sock, chatId, message);
        }

        // Process weather request
        await processWeatherRequest(sock, chatId, message, query);
        
    } catch (error) {
        console.error('Weather Command Error:', error);
        await sendErrorMessage(sock, chatId, message);
    }
}

/**
 * Extract text from message object
 */
function extractMessageText(message) {
    return message.message?.conversation || 
           message.message?.extendedTextMessage?.text ||
           message.text;
}

/**
 * Parse command and query from text
 */
function parseCommand(text) {
    const parts = text.split(' ');
    const command = parts[0].toLowerCase();
    const query = parts.slice(1).join(' ').trim();
    
    return { command, query };
}

/**
 * Send initial prompt message
 */
async function sendPromptMessage(sock, chatId, message) {
    const promptText = "Please provide a city name after .weather or .cuaca\n\n" +
                      "Example: .weather Nairobi";
    
    return await sock.sendMessage(chatId, { text: promptText }, { quoted: fakeContact });
}

/**
 * Send empty query message
 */
async function sendEmptyQueryMessage(sock, chatId, message) {
    return await sock.sendMessage(chatId, { 
        text: "⚠️ Please provide a city name!\nExample: .weather Nairobi" 
    }, { quoted: fakeContact });
}

/**
 * Send error message
 */
async function sendErrorMessage(sock, chatId, message) {
    return await sock.sendMessage(chatId, {
        text: "❌ An error occurred. Please try again later.",
        contextInfo: {
            mentionedJid: [message.key.participant || message.key.remoteJid],
            quotedMessage: message.message
        }
    }, { quoted: fakeContact });
}

/**
 * Process weather request
 */
async function processWeatherRequest(sock, chatId, message, cityQuery) {
    // Show processing indicator
    await sock.sendMessage(chatId, {
        react: { text: '🌤️', key: message.key }
    });

    try {
        await handleWeatherAPIRequest(sock, chatId, message, cityQuery);
    } catch (error) {
        console.error('API Processing Error:', error);
        await sendAPIErrorMessage(sock, chatId, message, error);
    }
}

/**
 * Handle weather API request
 */
async function handleWeatherAPIRequest(sock, chatId, message, cityQuery) {
    const apiUrl = `https://rijalganzz.web.id/tools/cuaca?kota=${encodeURIComponent(cityQuery)}`;
    
    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data || data.status !== 200) {
        throw new Error('Failed to fetch weather data');
    }

    const result = data.result;
    
    // Format weather message
    const weatherMsg = formatWeatherMessage(result);
    
    await sock.sendMessage(chatId, {
        text: weatherMsg
    }, { quoted: fakeContact });
}

/**
 * Format weather message from API result
 */
function formatWeatherMessage(result) {
    return `
🌤️ *Weather in ${result.city || "Unknown"}, ${result.country || "Unknown"}*

📌 Condition: ${result.condition || "-"}
🌡️ Temperature: ${result.temperature || "-"}
💧 Humidity: ${result.humidity || "-"}
💨 Wind: ${result.wind || "-"}
🧭 Pressure: ${result.pressure || "-"}
☀️ UV Index: ${result.uv_index || "-"}

🕒 Observation Time: ${result.observation_time || "-"}
📍 Region: ${result.region || "-"}
🗺️ Coordinates: ${result.latitude || "-"}, ${result.longitude || "-"}
    `.trim();
}

/**
 * Send API error message
 */
async function sendAPIErrorMessage(sock, chatId, message, error) {
    const errorMessage = "❌ Failed to fetch weather data, please try another city.";
    
    await sock.sendMessage(chatId, {
        text: errorMessage,
        contextInfo: {
            mentionedJid: [message.key.participant || message.key.remoteJid],
            quotedMessage: message.message
        }
    }, { quoted: fakeContact });
}

module.exports = weatherCommand;
