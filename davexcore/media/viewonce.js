const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function viewonceCommand(sock, chatId, message) {
    const fkontak = createFakeContact(message);
    
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;
    const quotedVideo = quoted?.videoMessage;
    const quotedAudio = quoted?.audioMessage;

    const downloadBuffer = async (msg, type) => {
        const stream = await downloadContentFromMessage(msg, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
    };

    if (quotedImage && quotedImage.viewOnce) {
        const buffer = await downloadBuffer(quotedImage, 'image');
        await sock.sendMessage(
            chatId,
            { 
                image: buffer, 
                fileName: 'image.jpg', 
                caption: quotedImage.caption || 'Retrieved image' 
            }, 
            { quoted: fkontak }
        );

    } else if (quotedVideo && quotedVideo.viewOnce) {
        const buffer = await downloadBuffer(quotedVideo, 'video');
        await sock.sendMessage(
            chatId,
            { 
                video: buffer, 
                fileName: 'video.mp4', 
                caption: quotedVideo.caption || 'Retrieved video' 
            }, 
            { quoted: fkontak }
        );

    } else if (quotedAudio && quotedAudio.viewOnce) {
        const buffer = await downloadBuffer(quotedAudio, 'audio');
        await sock.sendMessage(
            chatId,
            { 
                audio: buffer, 
                fileName: 'audio.mp3', 
                mimetype: quotedAudio.mimetype || 'audio/mp4'
            }, 
            { quoted: fkontak }
        );

    } else {
        await sock.sendMessage(chatId, { text: 'Reply to view-once media.' }, { quoted: fkontak });
    }
}

module.exports = viewonceCommand;