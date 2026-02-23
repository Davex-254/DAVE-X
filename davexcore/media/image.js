const axios = require('axios');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

// Track processed message IDs to prevent duplicate handling
const processedMessages = new Set();
async function imageCommand(sock, chatId, message) {
    const fkontak = createFakeContact(message);
    
    try {
        const msgId = message?.key?.id;
        if (!msgId) return;

        // Prevent duplicate processing
        if (processedMessages.has(msgId)) return;
        processedMessages.add(msgId);
        setTimeout(() => processedMessages.delete(msgId), 5 * 60 * 1000);

        // Extract text content
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        if (!text) {
            return sock.sendMessage(chatId, { 
                text: "Please provide a search term."
            }, { quoted: fkontak });
        }

        // Parse query
        const query = text.split(' ').slice(1).join(' ').trim();
        if (!query) {
            return sock.sendMessage(chatId, { 
                text: "Please provide a search term."
            }, { quoted: fkontak });
        }

        // React indicator
        await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

        // API call
        const apiUrl = `https://iamtkm.vercel.app/downloaders/img?apikey=tkm&text=${encodeURIComponent(query)}`;
        let apiResponse;
        try {
            apiResponse = await axios.get(apiUrl);
        } catch (err) {
            console.error("Image API error:", err.message);
            return sock.sendMessage(chatId, { 
                text: "Image service unavailable."
            }, { quoted: fkontak });
        }

        const data = apiResponse?.data;
        const imageUrls = Array.isArray(data?.result) ? data.result.slice(0, 10) : [];

        if (data?.status && imageUrls.length > 0) {
            // Send first image with caption
            await sock.sendMessage(chatId, {
                image: { url: imageUrls[0] },
                caption: `Results for: ${query}`
            }, { quoted: fkontak });

            // Send remaining images without captions
            for (let i = 1; i < imageUrls.length; i++) {
                try {
                    await sock.sendMessage(chatId, {
                        image: { url: imageUrls[i] }
                    });
                    if (i < imageUrls.length - 1) {
                        await new Promise(res => setTimeout(res, 500));
                    }
                } catch (imgErr) {
                    console.error(`Image error ${i + 1}:`, imgErr.message);
                }
            }

        } else {
            await sock.sendMessage(chatId, { 
                text: `No images for: ${query}`
            }, { quoted: fkontak });
        }

    } catch (error) {
        console.error("Image command error:", error.message);
        await sock.sendMessage(chatId, { 
            text: "Failed to search images."
        }, { quoted: fkontak });
    }
}

module.exports = imageCommand;