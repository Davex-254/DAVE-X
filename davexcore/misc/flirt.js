const fetch = require('node-fetch');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function flirtCommand(sock, chatId, message) {
    try {
        const fakeContact = createFakeContact(message);
        const shizokeys = 'shizo';
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/flirt?apikey=${shizokeys}`);
        
        if (!res.ok) {
            throw await res.text();
        }
        
        const json = await res.json();
        const flirtMessage = json.result;

        // Send the flirt message
        await sock.sendMessage(chatId, { text: flirtMessage }, { quoted: fakeContact });
    } catch (error) {
        console.error('Error in flirt command:', error);
        const fakeContact = createFakeContact(message);
        await sock.sendMessage(chatId, { text: '❌ Failed to get flirt message. Please try again later!' }, { quoted: fakeContact });
    }
}

module.exports = { flirtCommand }; 