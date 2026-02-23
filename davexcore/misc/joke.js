const axios = require('axios');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

module.exports = async function (sock, chatId, message) {
    const fakeContact = createFakeContact(message);
    try {
        // Fetch joke from API
        const response = await axios.get('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json' }
        });
        const joke = response.data.joke;

        // Random funny images related to jokes
        const jokeImages = [
            'https://images.unsplash.com/photo-1611267254323-4db7b39c732c?w=500&q=80', // Laughing emoji
            'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&q=80', // Comedy masks
            'https://images.unsplash.com/photo-1541336032412-2048a678540d?w=500&q=80', // People laughing
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80', // Funny face
            'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=500&q=80', // Comedy theater
            'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&q=80', // Smiling faces
            'https://images.unsplash.com/photo-1542309667-2a115d1f54c6?w=500&q=80', // Standup comedy
            'https://images.unsplash.com/photo-1464207687429-7505649dae38?w=500&q=80'  // Funny moment
        ];

        // Select random image
        const randomImage = jokeImages[Math.floor(Math.random() * jokeImages.length)];

        // Add joke reactions/buttons
        const buttons = [
            { buttonId: '.joke', buttonText: { displayText: 'Another Joke 😂' }, type: 1 },
            { buttonId: '.pun', buttonText: { displayText: 'Puns 🎭' }, type: 1 },
            { buttonId: '.meme', buttonText: { displayText: 'Memes 🤣' }, type: 1 }
        ];

        // Send image with joke as caption
        await sock.sendMessage(chatId, { 
            image: { url: randomImage },
            caption: `😂 *Dad Joke Alert!* 😂\n\n"${joke}"\n\n_😆 Hope that made you smile!_`,
            buttons: buttons,
            headerType: 1
        }, { quoted: fakeContact });

    } catch (error) {
        console.error('Error fetching joke:', error);
        
        // Fallback jokes in case API fails
        const fallbackJokes = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "Why did the scarecrow win an award? He was outstanding in his field!",
            "Why don't eggs tell jokes? They'd crack each other up!",
            "What do you call a fake noodle? An impasta!",
            "Why did the math book look so sad? Because it had too many problems!"
        ];
        
        const randomJoke = fallbackJokes[Math.floor(Math.random() * fallbackJokes.length)];
        const fallbackImage = 'https://images.unsplash.com/photo-1611267254323-4db7b39c732c?w=500&q=80';

        await sock.sendMessage(chatId, { 
            image: { url: fallbackImage },
            caption: `😂 *Dad Joke Alert!* 😂\n\n"${randomJoke}"\n\n_😆 API failed but here's a backup joke!_`,
            buttons: [
                { buttonId: '.joke', buttonText: { displayText: 'Try Again 🔄' }, type: 1 }
            ]
        }, { quoted: fakeContact });
    }
};
