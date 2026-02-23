const axios = require('axios');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function downloadAndValidate(downloadUrl, timeout = 60000) {
    const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'arraybuffer',
        timeout: timeout,
        maxRedirects: 5,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        validateStatus: (status) => status >= 200 && status < 400
    });

    const buffer = Buffer.from(response.data);

    if (buffer.length < 5000) {
        throw new Error('File too small, likely not audio');
    }

    const headerStr = buffer.slice(0, 50).toString('utf8').toLowerCase();
    if (headerStr.includes('<!doctype') || headerStr.includes('<html') || headerStr.includes('bad gateway')) {
        throw new Error('Received HTML instead of audio');
    }

    return buffer;
}

async function tiktokaudioCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    const botName = getBotName();

    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text || '';

    const url = text.split(' ').slice(1).join(' ').trim();

    if (!url) {
        return sock.sendMessage(chatId, { 
            text: `*${botName} TIKTOK AUDIO*\n\nUsage: .tiktokaudio <url>\nExample: .tiktokaudio https://vm.tiktok.com/abc123`
        }, { quoted: fake });
    }

    const tiktokPatterns = [/tiktok\.com\//, /vm\.tiktok\.com\//, /vt\.tiktok\.com\//];
    if (!tiktokPatterns.some(p => p.test(url))) {
        return sock.sendMessage(chatId, { 
            text: `*${botName}*\nInvalid TikTok link!`
        }, { quoted: fake });
    }

    try {
        await sock.sendMessage(chatId, { 
            react: { text: '🎵', key: message.key } 
        });

        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nDownloading TikTok audio...`
        }, { quoted: fake });

        // Using the same working APIs as main TikTok command
        const apis = [
            {
                name: 'iamtkm',
                url: `https://iamtkm.vercel.app/downloaders/tiktokdl?apikey=tkm&url=${encodeURIComponent(url)}`,
                parse: d => ({
                    audio: d?.result?.audio,
                    title: d?.result?.title || 'TikTok Audio'
                }),
                check: d => d?.status && d?.result
            },
            {
                name: 'Keith',
                url: `https://apiskeith.top/download/tiktok?url=${encodeURIComponent(url)}`,
                parse: d => ({
                    audio: d?.result?.audio,
                    title: d?.result?.title || 'TikTok Audio'
                }),
                check: d => d?.status && d?.result
            },
            {
                name: 'BK9',
                url: `https://bk9.fun/download/tiktok?url=${encodeURIComponent(url)}`,
                parse: d => ({
                    audio: d?.BK9?.audio,
                    title: d?.BK9?.title || 'TikTok Audio'
                }),
                check: d => d?.BK9
            },
            {
                name: 'Dreaded',
                url: `https://api.dreaded.site/api/tiktok?url=${encodeURIComponent(url)}`,
                parse: d => ({
                    audio: d?.result?.audio,
                    title: d?.result?.title || 'TikTok Audio'
                }),
                check: d => d?.result
            },
            {
                name: 'Siputzx',
                url: `https://api.siputzx.my.id/api/d/tiktok?url=${encodeURIComponent(url)}`,
                parse: d => ({
                    audio: d?.data?.audio,
                    title: d?.data?.title || 'TikTok Audio'
                }),
                check: d => d?.data
            }
        ];

        let audioUrl = null;
        let title = 'TikTok Audio';

        for (const api of apis) {
            try {
                const res = await axios.get(api.url, { timeout: 15000 });
                if (api.check(res.data)) {
                    const result = api.parse(res.data);
                    if (result?.audio && typeof result.audio === 'string' && result.audio.startsWith('http')) {
                        audioUrl = result.audio;
                        title = result.title || 'TikTok Audio';
                        console.log(`✅ ${api.name} API working for audio`);
                        break;
                    }
                }
            } catch (err) {
                console.log(`${api.name} API failed:`, err.message);
            }
        }

        if (!audioUrl) {
            throw new Error('All audio download APIs are currently unavailable');
        }

        // Download the audio
        const audioBuffer = await downloadAndValidate(audioUrl);

        // Send the audio
        await sock.sendMessage(chatId, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            ptt: false,
            caption: `*${botName} TIKTOK AUDIO*\n\n📌 *${title}*`
        }, { quoted: fake });

        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: message.key } 
        });

    } catch (error) {
        console.error("TikTok Audio Error:", error);
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\n❌ Error: ${error.message || "Failed to download TikTok audio"}`
        }, { quoted: fake });
    }
}

module.exports = tiktokaudioCommand;