const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

function rpsCommand(sock, chatId, message, args) {
    const fakeContact = createFakeContact(message);
    const botName = getBotName();
    const choices = ['rock', 'paper', 'scissors'];
    const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };
    
    const userChoice = (args[0] || '').toLowerCase();
    if (!choices.includes(userChoice)) {
        return sock.sendMessage(chatId, { text: `*${botName} RPS*\n\nUsage: .rps <rock|paper|scissors>\nExample: .rps rock` }, { quoted: fakeContact });
    }
    
    const botChoice = choices[Math.floor(Math.random() * 3)];
    
    let result;
    if (userChoice === botChoice) result = "It's a TIE!";
    else if ((userChoice === 'rock' && botChoice === 'scissors') || (userChoice === 'paper' && botChoice === 'rock') || (userChoice === 'scissors' && botChoice === 'paper')) result = 'You WIN!';
    else result = 'You LOSE!';
    
    const text = `*${botName} RPS*\n\nYou: ${emojis[userChoice]} ${userChoice}\nBot: ${emojis[botChoice]} ${botChoice}\n\n*${result}*`;
    return sock.sendMessage(chatId, { text }, { quoted: fakeContact });
}

module.exports = rpsCommand;
