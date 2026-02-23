const yts = require('yt-search');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function ytsCommand(sock, chatId, senderId, message, userMessage) {
    const fkontak = createFakeContact(message);
    
    try {
        const args = userMessage.split(' ').slice(1);
        const query = args.join(' ');

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: `YouTube Search\nUsage: .yts <search>\nExample: .yts Godzilla`
            }, { quoted: fkontak });
        }

        await sock.sendMessage(chatId, {
            text: `Searching: "${query}"...`
        }, { quoted: fkontak });

        let searchResults;
        try {
            searchResults = await yts(query);
        } catch (searchError) {
            console.error('Search error:', searchError);
            return await sock.sendMessage(chatId, {
                text: 'Search failed. Try again.'
            }, { quoted: fkontak });
        }

        const videos = (searchResults && searchResults.videos) ? searchResults.videos.slice(0, 15) : [];

        if (videos.length === 0) {
            return await sock.sendMessage(chatId, {
                text: `No results: "${query}"`
            }, { quoted: fkontak });
        }

        let resultMessage = `Results: "${query}"\n\n`;

        videos.forEach((video, index) => {
            const duration = video.timestamp || 'N/A';
            const views = video.views ? video.views.toLocaleString() : 'N/A';

            resultMessage += `${index + 1}. ${video.title}\n`;
            resultMessage += `URL: ${video.url}\n`;
            resultMessage += `Duration: ${duration}\n`;
            resultMessage += `Views: ${views}\n`;
            resultMessage += `Channel: ${video.author?.name || 'N/A'}\n\n`;
        });

        resultMessage += `Tip: Use play <url> for audio\n`;
        resultMessage += `Use video <url> for video`;

        await sock.sendMessage(chatId, { text: resultMessage }, { quoted: fkontak });

    } catch (error) {
        console.error('YouTube search error:', error);
        await sock.sendMessage(chatId, {
            text: 'Search error occurred.'
        }, { quoted: fkontak });
    }
}

module.exports = ytsCommand;