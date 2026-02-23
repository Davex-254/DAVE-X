const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

const goodnightMessages = [
    "Good night! May your dreams be filled with joy and peace.",
    "Sleep tight! Tomorrow is a brand new day full of opportunities.",
    "Wishing you a restful night and sweet dreams.",
    "Good night! Let go of today's worries and rest well.",
    "May the stars watch over you tonight. Sleep peacefully!",
    "Good night! May you wake up refreshed and ready to conquer the day.",
    "Rest your mind and body tonight. Sweet dreams!",
    "Sending warm wishes for a cozy, peaceful night.",
    "Good night! May your sleep be deep and your dreams be sweet.",
    "Close your eyes and let the calm of the night embrace you. Good night!",
    "Wishing you a night as wonderful as you are. Sleep well!",
    "May tonight bring you the rest you deserve. Good night!",
    "The stars are shining just for you tonight. Sweet dreams!",
    "Good night! Let the moonlight guide you to beautiful dreams.",
    "Time to recharge. Wishing you a peaceful and restful night!"
];

async function goodnightCommand(sock, chatId, message) {
    const fakeContact = createFakeContact(message);
    const pushName = message.pushName || 'Friend';
    try {
        const randomMsg = goodnightMessages[Math.floor(Math.random() * goodnightMessages.length)];
        await sock.sendMessage(chatId, { text: `${randomMsg}\n\nGood night, ${pushName}!` }, { quoted: fakeContact });
    } catch (error) {
        console.error('Error in goodnight command:', error);
        await sock.sendMessage(chatId, { text: `Good night, ${pushName}! Sleep well and have sweet dreams!` }, { quoted: fakeContact });
    }
}

module.exports = { goodnightCommand };
