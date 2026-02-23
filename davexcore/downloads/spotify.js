const axios = require('axios');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let i = 1; i <= attempts; i++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (i < attempts) {
                await new Promise(r => setTimeout(r, i * 1000));
            }
        }
    }
    throw lastError;
}

async function spotifyCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    
    try {
        const rawText = message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() ||
            '';

        const used = (rawText || '').split(/\s+/)[0] || '.spotify';
        const query = rawText.slice(used.length).trim();

        if (!query) {
            await sock.sendMessage(chatId, { 
                text: `✦ *${botName}* Spotify\n\nUse: .spotify <song name>\nExample: .spotify Blinding Lights` 
            }, { quoted: fake });
            return;
        }

        // Send initial reaction
        await sock.sendMessage(chatId, {
            react: { text: '🔍', key: message.key }
        });

        await sock.sendMessage(chatId, {
            text: `✦ *${botName}*\nSearching: ${query}...`
        }, { quoted: fake });

        // Try multiple APIs like in song/play commands
        const apis = [
            {
                url: `https://apiskeith.top/download/spotify?query=${encodeURIComponent(query)}`,
                parse: (d) => ({
                    download: d?.result?.download || d?.result?.url || d?.result?.link,
                    title: d?.result?.title || d?.title,
                    artist: d?.result?.artist || d?.artist,
                    cover: d?.result?.cover || d?.result?.thumbnail || d?.cover,
                    duration: d?.result?.duration || d?.duration
                })
            },
            {
                url: `https://api.siputzx.my.id/api/d/spotify?query=${encodeURIComponent(query)}`,
                parse: (d) => ({
                    download: d?.data?.download || d?.data?.url || d?.data?.link,
                    title: d?.data?.title,
                    artist: d?.data?.artist,
                    cover: d?.data?.cover || d?.data?.thumbnail,
                    duration: d?.data?.duration
                })
            },
            {
                url: `https://bk9.fun/download/spotify?q=${encodeURIComponent(query)}`,
                parse: (d) => ({
                    download: d?.BK9?.download || d?.BK9?.url || d?.BK9?.link,
                    title: d?.BK9?.title,
                    artist: d?.BK9?.artist,
                    cover: d?.BK9?.cover || d?.BK9?.thumbnail,
                    duration: d?.BK9?.duration
                })
            }
        ];

        let result = null;
        let downloadUrl = null;

        for (const api of apis) {
            try {
                const res = await tryRequest(() => axios.get(api.url, AXIOS_DEFAULTS));
                if (res?.data) {
                    const parsed = api.parse(res.data);
                    if (parsed.download) {
                        result = parsed;
                        downloadUrl = parsed.download;
                        break;
                    }
                }
            } catch (err) {
                console.log(`API failed:`, err.message);
                continue;
            }
        }

        if (!downloadUrl || !result) {
            throw new Error('No results found');
        }

        // Update reaction
        await sock.sendMessage(chatId, {
            react: { text: '⬇️', key: message.key }
        });

        // Build caption
        let caption = `✦ *${botName}* Spotify\n\n`;
        caption += `Title: ${result.title || 'Unknown'}\n`;
        caption += `Artist: ${result.artist || 'Unknown'}\n`;
        if (result.duration) caption += `Duration: ${result.duration}\n`;

        // Send thumbnail with caption if available
        if (result.cover) {
            await sock.sendMessage(chatId, { 
                image: { url: result.cover }, 
                caption 
            }, { quoted: fake });
        } else {
            await sock.sendMessage(chatId, { 
                text: caption 
            }, { quoted: fake });
        }

        // Send audio file
        const safeTitle = (result.title || 'spotify').replace(/[\\/:*?"<>|]/g, '');
        await sock.sendMessage(chatId, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${safeTitle}.mp3`
        }, { quoted: fake });

        // Success reaction
        await sock.sendMessage(chatId, {
            react: { text: '✅', key: message.key }
        });

    } catch (error) {
        console.error('Spotify error:', error.message);

        let errorMsg = '✦ Failed to download.';
        if (error.message.includes('No results')) {
            errorMsg = '✦ No results found.';
        } else if (error.message.includes('timeout')) {
            errorMsg = '✦ Request timeout.';
        }

        await sock.sendMessage(chatId, { 
            text: errorMsg
        }, { quoted: fake });
        
        await sock.sendMessage(chatId, {
            react: { text: '❌', key: message.key }
        });
    }
}

module.exports = spotifyCommand;