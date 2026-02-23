const axios = require('axios');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function fetchCommand(sock, chatId, message) {
    const fkontak = createFakeContact(message);

    try {
        // Initial reaction
        await sock.sendMessage(chatId, {
            react: { text: "🔍", key: message.key }
        });

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const url = text.split(' ').slice(1).join(' ').trim();

        if (!url) {
            return await sock.sendMessage(chatId, { 
                text: "Please provide a URL." 
            }, { quoted: fkontak });
        }

        // Fetch content from URL
        const response = await axios.get(url, { 
            responseType: 'arraybuffer',
            timeout: 10000
        });

        const contentType = response.headers['content-type'];
        if (!contentType) {
            return await sock.sendMessage(chatId, { 
                text: "No content type returned." 
            }, { quoted: fkontak });
        }

        const buffer = Buffer.from(response.data);
        const filename = url.split('/').pop() || "file";

        // Handle different content types
        if (contentType.includes('application/json')) {
            const json = JSON.parse(buffer.toString());
            return await sock.sendMessage(chatId, { 
                text: "```json\n" + JSON.stringify(json, null, 2).slice(0, 4000) + "\n```" 
            }, { quoted: fkontak });
        }

        if (contentType.includes('text/html')) {
            const html = buffer.toString();
            return await sock.sendMessage(chatId, { 
                text: html.slice(0, 4000) 
            }, { quoted: fkontak });
        }

        if (contentType.includes('text/')) {
            return await sock.sendMessage(chatId, { 
                text: buffer.toString().slice(0, 4000) 
            }, { quoted: fkontak });
        }

        if (contentType.includes('image')) {
            return await sock.sendMessage(chatId, { 
                image: buffer
            }, { quoted: fkontak });
        }

        if (contentType.includes('video')) {
            return await sock.sendMessage(chatId, { 
                video: buffer
            }, { quoted: fkontak });
        }

        if (contentType.includes('audio')) {
            return await sock.sendMessage(chatId, {
                audio: buffer,
                mimetype: "audio/mpeg",
                fileName: filename
            }, { quoted: fkontak });
        }

        if (contentType.includes('application/pdf')) {
            return await sock.sendMessage(chatId, {
                document: buffer,
                mimetype: "application/pdf",
                fileName: filename
            }, { quoted: fkontak });
        }

        if (contentType.includes('application')) {
            return await sock.sendMessage(chatId, {
                document: buffer,
                mimetype: contentType,
                fileName: filename
            }, { quoted: fkontak });
        }

        // If no specific type matched
        await sock.sendMessage(chatId, { 
            text: "Unsupported content type." 
        }, { quoted: fkontak });

        // Error reaction
        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });

    } catch (error) {
        console.error('Fetch error:', error.message);

        let errorMessage = "Failed to fetch URL.";

        if (error.message.includes('timeout')) {
            errorMessage = "Request timeout.";
        } else if (error.code === 'ENOTFOUND') {
            errorMessage = "URL not found.";
        } else if (error.response?.status === 404) {
            errorMessage = "Page not found.";
        }

        await sock.sendMessage(chatId, { 
            text: errorMessage 
        }, { quoted: fkontak });

        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });
    }
}

module.exports = fetchCommand;