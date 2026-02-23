const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
const insults = [
    { 
        text: "You're like a cloud. When you disappear, it's a beautiful day!",
        image: "https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?w=500&h=500&fit=crop"
    },
    { 
        text: "You bring everyone so much joy when you leave the room!",
        image: "https://images.unsplash.com/photo-1541417904950-b855846fe074?w=500&h=500&fit=crop"
    },
    { 
        text: "I'd agree with you, but then we'd both be wrong.",
        image: "https://images.unsplash.com/photo-1594736797933-d0ea3ff8db41?w=500&h=500&fit=crop"
    },
    { 
        text: "You're not stupid; you just have bad luck thinking.",
        image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=500&h=500&fit=crop"
    },
    { 
        text: "Your secrets are always safe with me. I never even listen to them.",
        image: "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=500&h=500&fit=crop"
    },
    { 
        text: "You're proof that even evolution takes a break sometimes.",
        image: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=500&h=500&fit=crop"
    },
    { 
        text: "You have something on your chin... no, the third one down.",
        image: "https://images.unsplash.com/photo-1552058544-f2b08422138a?w=500&h=500&fit=crop"
    },
    { 
        text: "You're like a software update. Whenever I see you, I think, 'Do I really need this right now?'",
        image: "https://images.unsplash.com/photo-1556655848-f3a7049793bc?w=500&h=500&fit=crop"
    },
    { 
        text: "You bring everyone happiness... you know, when you leave.",
        image: "https://images.unsplash.com/photo-1542362567-b07e54358753?w=500&h=500&fit=crop"
    },
    { 
        text: "You're like a penny—two-faced and not worth much.",
        image: "https://images.unsplash.com/photo-1600028068385-5fd58c60f6ac?w=500&h=500&fit=crop"
    },
    { 
        text: "You're the human version of a participation trophy.",
        image: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=500&h=500&fit=crop"
    },
    { 
        text: "If ignorance is bliss, you must be the happiest person alive.",
        image: "https://images.unsplash.com/photo-1544725176-7c8e427d3a43?w=500&h=500&fit=crop"
    },
    { 
        text: "You have a face for radio and a voice for silent movies.",
        image: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=500&h=500&fit=crop"
    },
    { 
        text: "You're like a Monday morning—nobody wants you around.",
        image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500&h=500&fit=crop"
    },
    { 
        text: "Your personality is like a wet blanket—damp and suffocating.",
        image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=500&fit=crop"
    },
    { 
        text: "You're not the sharpest tool in the shed, but at least you're a tool.",
        image: "https://images.unsplash.com/photo-1586985288127-4c49caf13ac8?w=500&h=500&fit=crop"
    },
    { 
        text: "You're like a GPS with no signal—constantly lost and annoying.",
        image: "https://images.unsplash.com/photo-1558618666-fcd25856cd8c?w=500&h=500&fit=crop"
    },
    { 
        text: "Your brain must be powered by a potato battery.",
        image: "https://images.unsplash.com/photo-1592841200221-7ef6fa2c6b38?w=500&h=500&fit=crop"
    },
    { 
        text: "You're like a parking ticket—everyone hates seeing you.",
        image: "https://images.unsplash.com/photo-1569263979103-3750d5c70d4d?w=500&h=500&fit=crop"
    },
    { 
        text: "You have the charm of a dead battery.",
        image: "https://images.unsplash.com/photo-1546885642-6732a91620e2?w=500&h=500&fit=crop"
    },
    { 
        text: "You're like a screen door on a submarine—completely useless.",
        image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=500&h=500&fit=crop"
    },
    { 
        text: "Your conversation skills are like a broken pencil—pointless.",
        image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=500&h=500&fit=crop"
    },
    { 
        text: "You're the reason why aliens won't talk to us.",
        image: "https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?w=500&h=500&fit=crop"
    },
    { 
        text: "You have the memory of a goldfish and the attention span of a squirrel.",
        image: "https://images.unsplash.com/photo-1575783970733-1aaed45fecb8?w=500&h=500&fit=crop"
    },
    { 
        text: "You're like a bad app—always crashing at the worst times.",
        image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=500&h=500&fit=crop"
    },
    { 
        text: "Your jokes are so old, they have cobwebs.",
        image: "https://images.unsplash.com/photo-1533090368676-1fd25485db88?w=500&h=500&fit=crop"
    },
    { 
        text: "You're like a vacuum cleaner—loud, annoying, and full of dirt.",
        image: "https://images.unsplash.com/photo-1580399636394-3f5b5c53314a?w=500&h=500&fit=crop"
    },
    { 
        text: "You have the social skills of a tornado.",
        image: "https://images.unsplash.com/photo-1508606572321-901ea443707f?w=500&h=500&fit=crop"
    },
    { 
        text: "You're like a bad haircut—impossible to ignore.",
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&h=500&fit=crop"
    },
    { 
        text: "Your ideas are like yesterday's news—old and irrelevant.",
        image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&h=500&fit=crop"
    },
    { 
        text: "You're the human equivalent of a dial-up internet connection.",
        image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=500&h=500&fit=crop"
    },
    { 
        text: "You have the warmth of an iceberg and the charm of a tax audit.",
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=500&h=500&fit=crop"
    },
    { 
        text: "You're like a bad sequel—unnecessary and disappointing.",
        image: "https://images.unsplash.com/photo-1489599361624-1d6f0e7ddacc?w=500&h=500&fit=crop"
    },
    { 
        text: "Your brain is like a browser with 100 tabs open—nothing's loading.",
        image: "https://images.unsplash.com/photo-1547658719-da2b51169166?w=500&h=500&fit=crop"
    },
    { 
        text: "You're the reason they put instructions on toothpaste.",
        image: "https://images.unsplash.com/photo-1628076709546-89e5e6d5b9fb?w=500&h=500&fit=crop"
    },
    { 
        text: "You have the personality of a cardboard box.",
        image: "https://images.unsplash.com/photo-1522543551254-efc0e2c8283f?w=500&h=500&fit=crop"
    },
    { 
        text: "You're like a weather forecast—usually wrong but still talking.",
        image: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=500&h=500&fit=crop"
    },
    { 
        text: "Your presence is like a pop-up ad—unwanted and irritating.",
        image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=500&h=500&fit=crop"
    },
    { 
        text: "You're like a broken record—repetitive and annoying.",
        image: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=500&h=500&fit=crop"
    },
    { 
        text: "You have the timing of a traffic light that's always red.",
        image: "https://images.unsplash.com/photo-1594736797933-d0ea3ff8db41?w=500&h=500&fit=crop"
    },
    { 
        text: "You're the human version of a loading screen—everyone's waiting for you to finish.",
        image: "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=500&h=500&fit=crop"
    }
];

// Fallback images in case primary ones fail
const fallbackImages = [
    "https://images.unsplash.com/photo-1579546929662-711aa81148cf?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=500&fit=crop"
];

async function downloadImage(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to download image');
        const buffer = await response.arrayBuffer();
        return Buffer.from(buffer);
    } catch (error) {
        console.error('Error downloading image:', error);
        return null;
    }
}

async function insultCommand(sock, chatId, message) {
    try {
        if (!message || !chatId) {
            console.log('Invalid message or chatId:', { message, chatId });
            return;
        }

        let userToInsult;
        
        // Check for mentioned users
        if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
            userToInsult = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
        }
        // Check for replied message
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToInsult = message.message.extendedTextMessage.contextInfo.participant;
        }
        
        if (!userToInsult) {
            await sock.sendMessage(chatId, { 
                text: 'Please mention someone or reply to their message to insult them!'
            });
            return;
        }

        const randomInsult = insults[Math.floor(Math.random() * insults.length)];
        const username = userToInsult.split('@')[0];

        // Add initial delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Try to send with image first
        try {
            const imageBuffer = await downloadImage(randomInsult.image);
            
            if (imageBuffer) {
                await sock.sendMessage(chatId, {
                    image: imageBuffer,
                    caption: `Hey @${username}, ${randomInsult.text}`,
                    mentions: [userToInsult]
                });
            } else {
                // Fallback to text only if image download fails
                throw new Error('Image download failed');
            }
            
        } catch (imageError) {
            console.log('Image sending failed, falling back to text:', imageError);
            
            // Try with fallback image
            const fallbackImageUrl = fallbackImages[Math.floor(Math.random() * fallbackImages.length)];
            const fallbackImageBuffer = await downloadImage(fallbackImageUrl);
            
            if (fallbackImageBuffer) {
                await sock.sendMessage(chatId, {
                    image: fallbackImageBuffer,
                    caption: `Hey @${username}, ${randomInsult.text}`,
                    mentions: [userToInsult]
                });
            } else {
                // Final fallback - text only
                await sock.sendMessage(chatId, { 
                    text: `Hey @${username}, ${randomInsult.text}`,
                    mentions: [userToInsult]
                });
            }
        }

    } catch (error) {
        console.error('Error in insult command:', error);
        
        if (error.data === 429) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            try {
                await sock.sendMessage(chatId, { 
                    text: 'Rate limit exceeded. Please try again in a few seconds.'
                });
            } catch (retryError) {
                console.error('Error sending retry message:', retryError);
            }
        } else {
            try {
                await sock.sendMessage(chatId, { 
                    text: 'An error occurred while sending the insult. Please try again.'
                });
            } catch (sendError) {
                console.error('Error sending error message:', sendError);
            }
        }
    }
}

module.exports = { insultCommand };
