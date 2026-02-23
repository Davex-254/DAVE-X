const yts = require('yt-search');
const axios = require('axios');
const fetch = require('node-fetch');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function ytplayCommand(sock, chatId, message) {
    const fkontak = createFakeContact(message);

    try {
        // Initial reaction
        await sock.sendMessage(chatId, {
            react: { text: "📺", key: message.key }
        });

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const input = text.split(' ').slice(1).join(' ').trim();

        if (!input) {
            return await sock.sendMessage(chatId, { 
                text: "Please provide a YouTube link or video title." 
            }, { quoted: fkontak });
        }

        let videoUrl;
        let videoInfo;

        // Check if input is a YouTube URL
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        if (youtubeRegex.test(input)) {
            videoUrl = input;

            // Extract video ID
            let videoId;
            if (input.includes('youtu.be/')) {
                videoId = input.split('youtu.be/')[1]?.split('?')[0];
            } else if (input.includes('youtube.com/watch?v=')) {
                videoId = input.split('v=')[1]?.split('&')[0];
            } else if (input.includes('youtube.com/embed/')) {
                videoId = input.split('embed/')[1]?.split('?')[0];
            }

            if (!videoId) {
                return await sock.sendMessage(chatId, { 
                    text: "Invalid YouTube URL." 
                }, { quoted: fkontak });
            }

            // Get video info
            const searchResult = await yts({ videoId });
            if (!searchResult || !searchResult.title) {
                return await sock.sendMessage(chatId, { 
                    text: "Failed to fetch video info." 
                }, { quoted: fkontak });
            }

            videoInfo = searchResult;
        } else {
            // Search by query
            const { videos } = await yts(input);
            if (!videos || videos.length === 0) {
                return await sock.sendMessage(chatId, { 
                    text: "No videos found." 
                }, { quoted: fkontak });
            }

            const video = videos[0];
            videoUrl = video.url;
            videoInfo = video;
        }

        // Fetch video data
        const response = await axios.get(`https://veron-apis.zone.id/downloader/youtube1?url=${videoUrl}`, {
            timeout: 10000
        });

        const ApiData = response.data;

        if (!ApiData?.success || !ApiData.result?.downloadUrl) {
            return await sock.sendMessage(chatId, { 
                text: "Failed to fetch video." 
            }, { quoted: fkontak });
        }

        const downloadUrl = ApiData.result.downloadUrl;
        const title = videoInfo.title;
        const thumbnail = videoInfo.thumbnail;
        const duration = videoInfo.timestamp || "Unknown";
        const views = videoInfo.views || "Unknown";

        // Get thumbnail
        let thumbBuffer = null;
        try {
            const thumbResponse = await fetch(thumbnail);
            thumbBuffer = Buffer.from(await thumbResponse.arrayBuffer());
        } catch (err) {
            // Ignore thumbnail error
        }

        // Send video
        await sock.sendMessage(chatId, {
            video: { url: downloadUrl },
            mimetype: "video/mp4",
            caption: `📹 ${title}\n⏱️ ${duration} | 👁️ ${views}\n\n📱 By DAVE-X Bot`,
            thumbnail: thumbBuffer
        }, { quoted: fkontak });

        // Success reaction
        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: message.key } 
        });

    } catch (error) {
        console.error('Error in ytplayCommand:', error.message);

        let errorMessage = "Failed to download video.";

        if (error.message.includes('timeout')) {
            errorMessage = "Request timeout.";
        } else if (error.message.includes('Network Error')) {
            errorMessage = "Network error.";
        }

        await sock.sendMessage(chatId, { 
            text: errorMessage 
        }, { quoted: fkontak });

        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });
    }
}

async function ytsongCommand(sock, chatId, message) {
    const fkontak = createFakeContact(message);

    try {
        // Initial reaction
        await sock.sendMessage(chatId, {
            react: { text: "🎵", key: message.key }
        });

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const input = text.split(' ').slice(1).join(' ').trim();

        if (!input) {
            return await sock.sendMessage(chatId, { 
                text: "Please provide a YouTube link or song name." 
            }, { quoted: fkontak });
        }

        let videoUrl;
        let videoInfo;

        // Check if input is a YouTube URL
        const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
        if (youtubeRegex.test(input)) {
            videoUrl = input;

            // Extract video ID
            let videoId;
            if (input.includes('youtu.be/')) {
                videoId = input.split('youtu.be/')[1]?.split('?')[0];
            } else if (input.includes('youtube.com/watch?v=')) {
                videoId = input.split('v=')[1]?.split('&')[0];
            } else if (input.includes('youtube.com/embed/')) {
                videoId = input.split('embed/')[1]?.split('?')[0];
            }

            if (!videoId) {
                return await sock.sendMessage(chatId, { 
                    text: "Invalid YouTube URL." 
                }, { quoted: fkontak });
            }

            // Get video info
            const searchResult = await yts({ videoId });
            if (!searchResult || !searchResult.title) {
                return await sock.sendMessage(chatId, { 
                    text: "Failed to fetch song info." 
                }, { quoted: fkontak });
            }

            videoInfo = searchResult;
        } else {
            // Search by query
            const { videos } = await yts(input);
            if (!videos || videos.length === 0) {
                return await sock.sendMessage(chatId, { 
                    text: "No songs found." 
                }, { quoted: fkontak });
            }

            const video = videos[0];
            videoUrl = video.url;
            videoInfo = video;
        }

        // Fetch audio data
        const response = await axios.get(`https://api.privatezia.biz.id/api/downloader/ytmp3?url=${videoUrl}`, {
            timeout: 10000
        });

        const apiData = response.data;

        if (!apiData?.status || !apiData.result?.downloadUrl) {
            return await sock.sendMessage(chatId, { 
                text: "Failed to fetch audio." 
            }, { quoted: fkontak });
        }

        const audioUrl = apiData.result.downloadUrl;
        const title = apiData.result.title || videoInfo.title;
        const duration = videoInfo.timestamp || "Unknown";
        const size = apiData.result.size || "Unknown";

        // Send audio
        await sock.sendMessage(chatId, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${title.replace(/[^\w\s]/gi, '')}.mp3`,
            caption: `🎵 ${title}\n⏱️ ${duration} | 📦 ${size}\n\n📱 By DAVE-X Bot`
        }, { quoted: fkontak });

        // Success reaction
        await sock.sendMessage(chatId, { 
            react: { text: '✅', key: message.key } 
        });

    } catch (error) {
        console.error('Error in ytsongCommand:', error.message);

        let errorMessage = "Failed to download audio.";

        if (error.message.includes('timeout')) {
            errorMessage = "Request timeout.";
        } else if (error.message.includes('Network Error')) {
            errorMessage = "Network error.";
        }

        await sock.sendMessage(chatId, { 
            text: errorMessage 
        }, { quoted: fkontak });

        await sock.sendMessage(chatId, { 
            react: { text: '❌', key: message.key } 
        });
    }
}

module.exports = {
    ytplayCommand,
    ytsongCommand
};