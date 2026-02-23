const fetch = require('node-fetch');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function shayariCommand(sock, chatId, message) {
    try {
        // Fetch English Shayari from API
        const response = await fetch('https://english-shayari-apis.onrender.com/shayari');
        const data = await response.json();
        
        if (!data || !data.shayari) {
            throw new Error('Invalid response from API');
        }

        // Background images for Shayari (you can replace with your own image URLs)
        const shayariImages = [
            'https://images.unsplash.com/photo-1519681393784-d120267933ba',
            'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0',
            'https://images.unsplash.com/photo-1462331940025-496dfbfc7564',
            'https://images.unsplash.com/photo-1518709268805-4e9042af2176'
        ];
        
        // Select random image
        const randomImage = shayariImages[Math.floor(Math.random() * shayariImages.length)];

        const buttons = [
            { buttonId: '.shayari', buttonText: { displayText: 'Shayari 🪄' }, type: 1 },
            { buttonId: '.roseday', buttonText: { displayText: '🌹 RoseDay' }, type: 1 },
            { buttonId: '.more', buttonText: { displayText: 'More ➕' }, type: 1 }
        ];

        // Send image with caption as Shayari
        await sock.sendMessage(chatId, { 
            image: { url: randomImage },
            caption: `💫 *Shayari for You* 💫\n\n${data.shayari}\n\n_✨ Let the words touch your heart ✨_`,
            buttons: buttons,
            headerType: 1
        }, { quoted: fakeContact });

    } catch (error) {
        console.error('Error in shayari command:', error);
        
        // Fallback Shayari in case API fails
        const fallbackShayaris = [
            "Stars whisper secrets to the night,\nYour smile makes everything bright ✨",
            "In the garden of life, you're the rarest flower,\nSpreading beauty hour by hour 🌸",
            "The moon envies your gentle glow,\nFor in your presence, all blessings flow 🌙",
            "Words may fail to express what I feel,\nBut my heart knows your love is real 💖"
        ];
        
        const randomShayari = fallbackShayaris[Math.floor(Math.random() * fallbackShayaris.length)];
        
        await sock.sendMessage(chatId, { 
            text: `*Shayari for You*\n\n${randomShayari}\n\n_Let the words touch your heart_`,
            buttons: [
                { buttonId: '.shayari', buttonText: { displayText: 'Try Again 🔄' }, type: 1 },
                { buttonId: '.roseday', buttonText: { displayText: '🌹 RoseDay' }, type: 1 }
            ]
        }, { quoted: fakeContact });
    }
}

module.exports = { shayariCommand };
