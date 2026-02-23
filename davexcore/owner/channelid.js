const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function channelidCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    
    const text = message.message?.conversation || 
                 message.message?.extendedTextMessage?.text || '';
    
    const url = text.split(' ').slice(1).join(' ').trim();
    
    if (!url) {
        return sock.sendMessage(chatId, { 
            text: `✦ *Channel ID*\n\nUse: .channelid <link>\nExample: .channelid https://whatsapp.com/channel/0029VbApvFQ2Jl84lhONkc3k`
        }, { quoted: fake });
    }

    if (!url.includes("https://whatsapp.com/channel/")) {
        return sock.sendMessage(chatId, { 
            text: `✦ Invalid channel link`
        }, { quoted: fake });
    }

    try {
        const channelCode = url.split('https://whatsapp.com/channel/')[1];
        
        // Try to get channel info
        let channelId = `${channelCode}@newsletter`;
        
        try {
            const metadata = await sock.newsletterMetadata("invite", channelCode);
            if (metadata && metadata.id) {
                channelId = metadata.id;
            }
        } catch (error) {
            console.error('Newsletter metadata error:', error);
        }

        await sock.sendMessage(chatId, { 
            text: channelId
        }, { quoted: fake });

    } catch (error) {
        console.error('ChannelID Error:', error);
        await sock.sendMessage(chatId, { 
            text: `✦ Failed to get channel ID`
        }, { quoted: fake });
    }
}

module.exports = channelidCommand;