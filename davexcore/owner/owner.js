const settings = require('../../daveset');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function ownerCommand(sock, chatId, message) {
    const fkontak = createFakeContact(message);
    
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${settings.botOwner}
TEL;waid=${settings.ownerNumber}:${settings.ownerNumber}
END:VCARD`;

    await sock.sendMessage(chatId, {
        contacts: { displayName: settings.botOwner, contacts: [{ vcard }] },
    }, { quoted: fkontak });
}

module.exports = ownerCommand;