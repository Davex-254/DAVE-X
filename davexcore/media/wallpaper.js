const axios = require('axios');
const cheerio = require('cheerio');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function fetchWallpapers(query) {
    const searchUrl = `https://www.uhdpaper.com/search?q=${encodeURIComponent(query)}&by-date=true`;

    const { data } = await axios.get(searchUrl, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36"
        },
        timeout: 30000
    });

    const $ = cheerio.load(data);
    const results = [];

    $('.post-outer').each((_, el) => {
        const title = $(el).find('h2').text().trim() || null;
        const resolution = $(el).find('b').text().trim() || null;
        let image = $(el).find('img').attr('data-src') || $(el).find('img').attr('src');
        if (image && image.startsWith('//')) image = 'https:' + image;
        const description = $(el).find('p').text().trim() || null;
        const link = $(el).find('a').attr('href');
        if (image) {
            results.push({ title, resolution, image, description, source: 'uhdpaper.com', link: link ? 'https://www.uhdpaper.com' + link : null });
        }
    });

    return results;
}

async function wallpaperCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    
    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text || '';
    
    const args = text.split(' ').slice(1).join(' ').trim();
    
    if (!args) {
        return sock.sendMessage(chatId, { 
            text: "Example: .wallpaper anime girl, 5\nProvide search query"
        }, { quoted: fake });
    }

    let query, count;
    if (args.includes(',')) {
        const [q, c] = args.split(',');
        query = q.trim();
        count = parseInt(c.trim()) || 5;
    } else {
        query = args.trim();
        count = 5;
    }

    if (count > 20) count = 20;

    try {
        const results = await fetchWallpapers(query);

        if (results.length === 0) {
            return sock.sendMessage(chatId, { 
                text: `No wallpapers found for "${query}"`
            }, { quoted: fake });
        }

        const toSend = results.slice(0, count);

        for (let i = 0; i < toSend.length; i++) {
            const wp = toSend[i];
            const caption = `*${wp.title || 'Wallpaper'}*\nResolution: ${wp.resolution || 'Unknown'}\n- DAVE X`;

            await sock.sendMessage(chatId, {
                image: { url: wp.image },
                caption,
            }, { quoted: fake });

            if (i < toSend.length - 1) await new Promise(res => setTimeout(res, 1500));
        }

    } catch (err) {
        console.error('Wallpaper error:', err);
        await sock.sendMessage(chatId, { 
            text: "Failed to fetch wallpapers"
        }, { quoted: fake });
    }
}

module.exports = wallpaperCommand;