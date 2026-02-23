const fs = require('fs');
const path = require('path');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function truthCommand(sock, chatId, message) {
    try {
        const fakeContact = createFakeContact(message);
        const truths = [
            "What's the most embarrassing thing that's happened to you recently?",
            "Have you ever had a crush on a teacher? Tell us about it.",
            "What's the biggest lie you've ever told your parents?",
            "What's the most childish thing you still do?",
            "Have you ever pretended to be sick to get out of something?",
            "What's the weirdest food combination you enjoy?",
            "What's a secret you've never told anyone?",
            "What's the most trouble you've ever been in?",
            "Have you ever cheated on a test?",
            "What's your most irrational fear?",
            "What's the cringiest thing you did to try to impress someone?",
            "What's something you've stolen and never returned?",
            "Have you ever had a dream about someone in this chat?",
            "What's the worst date you've ever been on?",
            "What's a habit you have that you're embarrassed about?",
            "What's the most embarrassing song on your playlist?",
            "Have you ever been caught doing something you shouldn't have?",
            "What's the silliest thing you've cried over?",
            "What's something you're secretly proud of?",
            "What's the most embarrassing nickname you've ever had?",
            "Have you ever ghosted someone? Why?",
            "What's the most awkward thing that's happened to you on a date?",
            "What's something you Google that you'd be embarrassed if people saw?",
            "What's your guilty pleasure TV show?",
            "What's the strangest thing you find attractive in someone?",
            "What's the most embarrassing text you've sent to the wrong person?",
            "Have you ever had a crush on a friend's significant other?",
            "What's the worst lie you've told to get out of plans?",
            "What's something you do when you're alone that you'd never do in public?",
            "What's the most embarrassing thing your parents have caught you doing?",
            "Have you ever pretended to know a song or movie when you didn't?",
            "What's the most money you've ever spent on something stupid?",
            "What's your biggest insecurity?",
            "Have you ever had a crush on a cartoon character?",
            "What's the most embarrassing thing you've posted on social media?",
            "What's a skill you pretend to have but actually don't?",
            "Have you ever laughed at something inappropriate? When?",
            "What's the most childish argument you've ever had?",
            "What's something you believed as a child that you now realize was ridiculous?",
            "Have you ever had a wardrobe malfunction in public?",
            "What's the most embarrassing thing you've done while drunk or tired?",
            "What's a secret talent you have that no one knows about?",
            "Have you ever been attracted to someone you shouldn't be?",
            "What's the worst present you've ever given someone?",
            "What's the most embarrassing thing you've searched on the internet?",
            "Have you ever had a crush on a celebrity that you're now embarrassed about?",
            "What's something you've done that you thought was cool but was actually cringe?",
            "What's the most embarrassing thing you've done for attention?",
            "Have you ever fallen in public? Tell us about it.",
            "What's the weirdest dream you've ever had?",
            "What's a food you hate but pretend to like?",
            "Have you ever had a crush on a video game character?",
            "What's the most embarrassing thing you've said to someone you liked?",
            "What's something you're still embarrassed about from years ago?",
            "Have you ever been caught checking someone out?",
            "What's the worst fashion phase you went through?",
            "What's the most embarrassing thing you've done on a first date?",
            "Have you ever cried during a movie? Which one?",
            "What's something you're still scared of as an adult?",
            "What's the most embarrassing thing you've done to fit in?",
            "Have you ever had a crush on a friend's sibling?",
            "What's the worst pickup line you've ever used?",
            "What's something you've done that you hope your parents never find out about?",
            "Have you ever been caught in a lie? What was it about?",
            "What's the most embarrassing thing you've worn?",
            "What's a secret hobby you have?",
            "Have you ever had a dream that felt too real? Describe it.",
            "What's the most embarrassing thing you've done for money?",
            "What's something you're too embarrassed to ask someone to teach you?",
            "Have you ever had a crush on a coworker or classmate?",
            "What's the worst joke you've ever told?",
            "What's the most embarrassing thing you've done while trying to be romantic?",
            "Have you ever been rejected? How did it happen?",
            "What's something you've broken and never told anyone about?",
            "What's the most embarrassing thing you've done to avoid someone?",
            "Have you ever had a celebrity crush that everyone else finds weird?",
            "What's the worst advice you've ever given someone?",
            "What's something you're secretly competitive about?",
            "Have you ever pretended to be someone else online?",
            "What's the most embarrassing thing you've done to get revenge?",
            "What's a childhood habit you still haven't broken?",
            "Have you ever had a crush on a fictional character?",
            "What's the most embarrassing thing you've confessed to someone?",
            "What's something you've lied about on your resume?",
            "Have you ever been caught singing or dancing when you thought no one was watching?",
            "What's the most embarrassing thing you've done to win an argument?",
            "What's a secret dream or goal you've never shared?",
            "Have you ever had a crush on someone much older or younger?",
            "What's the worst gift you've ever received?",
            "What's something you're embarrassed to admit you don't know how to do?",
            "Have you ever been caught doing something embarrassing on camera?",
            "What's the most embarrassing thing you've done to get attention from a crush?",
            "What's a secret fear you have about relationships?",
            "Have you ever had a crush on two best friends at the same time?",
            "What's the most embarrassing thing you've done while trying to be cool?",
            "What's something you're secretly jealous of?",
            "Have you ever had a dream that changed how you felt about someone?"
        ];

        // Get random truth
        const randomIndex = Math.floor(Math.random() * truths.length);
        const truthMessage = `🔮 *TRUTH CHALLENGE* 🔮\n\n${truths[randomIndex]}\n\n*Be honest!* 💫`;

        // Try to send with image, fallback to text only if image fails
        try {
            // You can replace this with your own image path or URL
            const imagePath = path.join(__dirname, '../assets/menu1.jpg');
            
            // Check if image exists, if not use a default image or send text only
            if (fs.existsSync(imagePath)) {
                await sock.sendMessage(chatId, {
                    image: { url: imagePath },
                    caption: truthMessage,
                    mentions: [message.key.participant || message.key.remoteJid]
                }, { quoted: fakeContact });
            } else {
                // If no image found, try to use a colorful message with emojis
                await sock.sendMessage(chatId, { 
                    text: `${truthMessage}`
                }, { quoted: fakeContact });
            }
        } catch (imageError) {
            console.error('Image error, sending text only:', imageError);
            // Fallback to text only if image fails
            await sock.sendMessage(chatId, { 
                text: truthMessage 
            }, { quoted: fakeContact });
        }

    } catch (error) {
        console.error('Error in truth command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Failed to get truth. Please try again later!' 
        }, { quoted: fakeContact });
    }
}

module.exports = { truthCommand };
