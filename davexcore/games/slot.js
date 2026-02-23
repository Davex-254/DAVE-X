const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function slotCommand(sock, chatId, message) {
    const fakeContact = createFakeContact(message);
    const botName = getBotName();
    const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '🔔', '⭐'];
    
    const s1 = symbols[Math.floor(Math.random() * symbols.length)];
    const s2 = symbols[Math.floor(Math.random() * symbols.length)];
    const s3 = symbols[Math.floor(Math.random() * symbols.length)];
    
    let result;
    if (s1 === s2 && s2 === s3) result = 'JACKPOT! You hit the jackpot!';
    else if (s1 === s2 || s2 === s3 || s1 === s3) result = 'Nice! Two matching symbols!';
    else result = 'Better luck next time!';
    
    const text = `*${botName} SLOT MACHINE*\n\n┏━━━━━━━━━┓\n┃  ${s1}  ${s2}  ${s3}  ┃\n┗━━━━━━━━━┛\n\n*${result}*`;
    await sock.sendMessage(chatId, { text }, { quoted: fakeContact });
}

module.exports = slotCommand;
