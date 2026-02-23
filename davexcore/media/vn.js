const fetch = require('node-fetch');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function vnCommand(sock, chatId, message, text, prefix) {
    try {
        const fake = createFakeContact(message);
        
        if (!text || text.trim() === '') {
            await sock.sendMessage(chatId, {
                text: `🎤 *Voice Note Generator*\n\n` +
                      `Usage: *${prefix}vn <text>*\n` +
                      `Example: *${prefix}vn Hello everyone!*\n\n` +
                      `Converts text to voice notes with multiple AI voices.`
            }, { quoted: fake });
            return;
        }

        const api = `https://api-faa.my.id/faa/tts-legkap?text=${encodeURIComponent(text)}`;
        const response = await fetch(api);
        const res = await response.json();

        if (!res.status || !res.result || res.result.length === 0) {
            await sock.sendMessage(chatId, {
                text: '❌ Failed to generate voice notes. Please try again later.'
            }, { quoted: fake });
            return;
        }

        let success = 0, failed = 0;
        
        for (let item of res.result) {
            if (item.url) {
                try {
                    await sock.sendMessage(chatId, {
                        audio: { url: item.url },
                        mimetype: 'audio/mp4',
                        ptt: true, // Send as voice note
                        caption: `🎙️ *Model:* ${item.voice_name || item.model}`
                    }, { quoted: fake });
                    success++;
                } catch (error) {
                    failed++;
                    console.error('Failed to send audio:', error);
                }
            } else {
                failed++;
            }
        }

        await sock.sendMessage(chatId, {
            text: `✅ *Voice Notes Generated*\n\n` +
                  `✅ Success: ${success}\n` +
                  `❌ Failed: ${failed}\n` +
                  `📊 Total: ${res.result.length} voice models`
        }, { quoted: fake });

    } catch (error) {
        console.error('VN command error:', error);
        const fake = createFakeContact(message);
        await sock.sendMessage(chatId, {
            text: '❌ Error generating voice notes. Please try again later.'
        }, { quoted: fake });
    }
}

module.exports = {
    vnCommand
};