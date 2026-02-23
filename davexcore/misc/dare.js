const fetch = require('node-fetch');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function dareCommand(sock, chatId, message) {
    try {
        const fakeContact = createFakeContact(message);
        const shizokeys = 'shizo';
        
        // Fetch dare text
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/dare?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const dareMessage = json.result;

        // Fetch a random dare image (using Unsplash API for example)
        const imageRes = await fetch('https://i.ibb.co/305yt26/bf84f20635dedd5dde31e7e5b6983ae9.jpg');
        const imageBuffer = await imageRes.buffer();

        // Send the dare message with image
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `*DARE:*\n\n${dareMessage}`,
            mimetype: 'image/jpeg'
        }, { quoted: fakeContact });

    } catch (error) {
        console.error('Error in dare command:', error);
        const fakeContact = createFakeContact(message);
        
        // Fallback: send text only if image fails
        try {
            await sock.sendMessage(chatId, { 
                text: `*DARE:*\n\n${dareMessage || 'Failed to get dare. Please try again later!'}` 
            }, { quoted: fakeContact });
        } catch (fallbackError) {
            await sock.sendMessage(chatId, { 
                text: '❌ Failed to get dare. Please try again later!' 
            }, { quoted: fakeContact });
        }
    }
}

module.exports = { dareCommand };
