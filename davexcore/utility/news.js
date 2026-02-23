const axios = require('axios');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function newsCommand(sock, chatId, message) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    
    try {
        const apiKey = 'dcd720a6f1914e2d9dba9790c188c08c';  // Replace with your NewsAPI key
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`);
        const articles = response.data.articles.slice(0, 5); // Get top 5 articles
        
        let newsMessage = `✦ *TOP NEWS*
╭─────────────────
│
`;
        articles.forEach((article, index) => {
            newsMessage += `│ ${index + 1}. *${article.title}*\n`;
            if (article.description) {
                newsMessage += `│ ${article.description.substring(0, 100)}${article.description.length > 100 ? '...' : ''}\n`;
            }
            newsMessage += `│\n`;
        });
        
        newsMessage += `╰─────────────────`;
        
        await sock.sendMessage(chatId, { text: newsMessage }, { quoted: fake });
        
    } catch (error) {
        console.error('Error fetching news:', error);
        await sock.sendMessage(chatId, { 
            text: `✦ Failed to fetch news` 
        }, { quoted: fake });
    }
}

module.exports = newsCommand;