const axios = require('axios');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function qcCommand(sock, chatId, message, text, prefix) {
    try {
        const fake = createFakeContact(message);
        
        if (!text) {
            await sock.sendMessage(chatId, {
                text: `*Quote Sticker Creator*\n\n` +
                      `Usage: *${prefix}qc <color> <text>*\n` +
                      `Example: *${prefix}qc blue Hello World*\n\n` +
                      `*Available Colors:*\n` +
                      `white, black, blue, red, green, yellow, purple, pink,\n` +
                      `orange, teal, cyan, gold, silver, and many more...\n\n` +
                      `Max 80 characters.`
            }, { quoted: fake });
            return;
        }

        const args = text.trim().split(' ');
        if (args.length < 2) {
            await sock.sendMessage(chatId, {
                text: `❌ Format: *${prefix}qc <color> <text>*\n` +
                      `Example: *${prefix}qc blue Hello World*`
            }, { quoted: fake });
            return;
        }

        const [color, ...messageParts] = args;
        const messageText = messageParts.join(' ');

        if (messageText.length > 80) {
            await sock.sendMessage(chatId, {
                text: '❌ Maximum 80 characters allowed!'
            }, { quoted: fake });
            return;
        }

        // Color mapping
        const colorMap = {
            'pink': '#f68ac9',
            'blue': '#6cace4',
            'red': '#f44336',
            'green': '#4caf50',
            'yellow': '#ffeb3b',
            'purple': '#9c27b0',
            'darkblue': '#0d47a1',
            'lightblue': '#03a9f4',
            'ash': '#9e9e9e',
            'orange': '#ff9800',
            'black': '#000000',
            'white': '#ffffff',
            'teal': '#008080',
            'lightpink': '#FFC0CB',
            'chocolate': '#A52A2A',
            'salmon': '#FFA07A',
            'magenta': '#FF00FF',
            'tan': '#D2B48C',
            'wheat': '#F5DEB3',
            'deeppink': '#FF1493',
            'fire': '#B22222',
            'skyblue': '#00BFFF',
            'brightskyblue': '#1E90FF',
            'hotpink': '#FF69B4',
            'lightskyblue': '#87CEEB',
            'seagreen': '#20B2AA',
            'darkred': '#8B0000',
            'orangered': '#FF4500',
            'cyan': '#48D1CC',
            'violet': '#BA55D3',
            'mossgreen': '#00FF7F',
            'darkgreen': '#008000',
            'navyblue': '#191970',
            'darkorange': '#FF8C00',
            'darkpurple': '#9400D3',
            'fuchsia': '#FF00FF',
            'darkmagenta': '#8B008B',
            'darkgray': '#2F4F4F',
            'peachpuff': '#FFDAB9',
            'darkishgreen': '#BDB76B',
            'darkishred': '#DC143C',
            'goldenrod': '#DAA520',
            'darkishgray': '#696969',
            'darkishpurple': '#483D8B',
            'gold': '#FFD700',
            'silver': '#C0C0C0'
        };

        const backgroundColor = colorMap[color.toLowerCase()];
        if (!backgroundColor) {
            await sock.sendMessage(chatId, {
                text: '❌ Invalid color! Use .qc to see available colors.'
            }, { quoted: fake });
            return;
        }

        // Get user info
        const username = message.pushName || 'User';
        let avatar;
        try {
            avatar = await sock.profilePictureUrl(message.sender, 'image');
        } catch {
            avatar = 'https://files.catbox.moe/nwvkbt.png';
        }

        const json = {
            type: 'quote',
            format: 'png',
            backgroundColor,
            width: 512,
            height: 768,
            scale: 2,
            messages: [{
                entities: [],
                avatar: true,
                from: {
                    id: 1,
                    name: username,
                    photo: {
                        url: avatar
                    }
                },
                text: messageText,
                replyMessage: {}
            }]
        };

        const response = await axios.post('https://bot.lyo.su/quote/generate', json, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const buffer = Buffer.from(response.data.result.image, 'base64');
        
        // Send as sticker
        await sock.sendMessage(chatId, {
            sticker: buffer,
            mimetype: 'image/webp'
        }, { quoted: fake });

    } catch (error) {
        console.error('QC command error:', error);
        const fake = createFakeContact(message);
        await sock.sendMessage(chatId, {
            text: '❌ Failed to create quote sticker. Please try again.'
        }, { quoted: fake });
    }
}

module.exports = {
    qcCommand
};