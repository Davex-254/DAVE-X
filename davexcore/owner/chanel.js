const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
// Channel JID Extractor
async function chaneljidCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const fake = createFakeContact(message);

        // Extract args from the message text
        let args = [];
        if (text) {
            // Split text by spaces and remove the command part
            args = text.trim().split(/\s+/).slice(1);
        }

        let targetJid = null;

        // 1. If a link or JID is provided
        if (args[0]) {
            const input = args[0];

            // Newsletter JID directly
            if (input.endsWith('@newsletter')) {
                targetJid = input;
            }
            // WhatsApp channel/newsletter link
            else if (input.includes('whatsapp.com/channel/')) {
                const code = input.split('/').pop().trim();
                targetJid = `120363${code}@newsletter`;
            }
            else {
                return await sock.sendMessage(
                    chatId,
                    {
                        text: 'Invalid channel link or JID'
                    },
                    { quoted: fake }
                );
            }
        }
        // 2. If no argument, use current chat JID
        else {
            targetJid = message.key.remoteJid;
        }

        // 3. Final validation
        if (!targetJid.endsWith('@newsletter')) {
            return await sock.sendMessage(
                chatId,
                {
                    text: 'This is not a WhatsApp channel/newsletter\n\nTip:\n.channeljid <channel link or JID>'
                },
                { quoted: fake }
            );
        }

        // 4. Output ONLY the JID (clean & obvious)
        await sock.sendMessage(
            chatId,
            {
                text: `${targetJid}`
            },
            { quoted: fake }
        );

    } catch (err) {
        console.error('ChannelJID Error:', err);
        const fake = createFakeContact(message);
        
        await sock.sendMessage(
            chatId,
            {
                text: 'Failed to fetch channel JID'
            },
            { quoted: fake }
        );
    }
}

module.exports = { chaneljidCommand };