const fs = require('fs');
const path = require('path');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

async function vcfCommand(sock, chatId, message) {
    const fkontak = createFakeContact(message);
    const botName = getBotName();

    try {
        // Restrict to groups only
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: `✦ Group command only` 
            }, { quoted: fkontak });
            return;
        }

        // Get group metadata
        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];

        // Validate group size
        if (participants.length < 2) {
            await sock.sendMessage(chatId, { 
                text: `✦ Group must have at least 2 members` 
            }, { quoted: fkontak });
            return;
        }

        // Generate VCF content
        let vcfContent = '';
        participants.forEach(participant => {
            const phoneNumber = participant.id.split('@')[0];
            const displayName = participant.notify || `User_${phoneNumber}`;

            vcfContent += `BEGIN:VCARD\n` +
                          `VERSION:3.0\n` +
                          `FN:${displayName}\n` +
                          `TEL;TYPE=CELL:+${phoneNumber}\n` +
                          `END:VCARD\n`;
        });

        // Create temp file
        const sanitizedGroupName = groupMetadata.subject.replace(/[^\w]/g, '_');
        const tempDir = path.join(__dirname, '../temp');

        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const vcfPath = path.join(tempDir, `${sanitizedGroupName}.vcf`);
        fs.writeFileSync(vcfPath, vcfContent);

        // Send VCF file
        await sock.sendMessage(chatId, {
            document: fs.readFileSync(vcfPath),
            mimetype: 'text/vcard',
            fileName: `${sanitizedGroupName}.vcf`,
            caption: `✦ *VCF EXPORT*
    
  Group: ${groupMetadata.subject}
  Members: ${participants.length}`
        }, { quoted: fkontak });

        // Cleanup
        setTimeout(() => {
            try {
                if (fs.existsSync(vcfPath)) {
                    fs.unlinkSync(vcfPath);
                }
            } catch (cleanupError) {
                // Ignore cleanup errors
            }
        }, 5000);

    } catch (error) {
        console.error('VCF Error:', error.message);
        await sock.sendMessage(chatId, { 
            text: `✦ Failed to generate contacts` 
        }, { quoted: fkontak });
    }
}

module.exports = vcfCommand;