const axios = require('axios');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

module.exports = async function (sock, chatId, message) {
    const fakeContact = createFakeContact(message);
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        const fact = response.data.text;
        await sock.sendMessage(chatId, { text: fact },{ quoted: fakeContact });
    } catch (error) {
        console.error('Error fetching fact:', error);
        await sock.sendMessage(chatId, { text: 'Sorry, I could not fetch a fact right now.' },{ quoted: fakeContact });
    }
};
