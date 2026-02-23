const { createFakeContact, getBotName } = require('../../davelib/fakeContact');
async function groupInfoCommand(sock, chatId, msg) {
    try {
        async function resolveToPhone(sock, jid) {
            if (!jid) return 'unknown';
            const raw = jid.split('@')[0].split(':')[0];
            if (/^\d{7,15}$/.test(raw)) return raw;
            try {
                if (sock?.signalRepository?.lidMapping?.getPNForLID) {
                    const formats = [jid, `${raw}:0@lid`, `${raw}@lid`];
                    for (const fmt of formats) {
                        try {
                            const pn = await sock.signalRepository.lidMapping.getPNForLID(fmt);
                            if (pn) {
                                const num = String(pn).split('@')[0].replace(/[^0-9]/g, '');
                                if (num.length >= 7 && num.length <= 15 && num !== raw) return num;
                            }
                        } catch {}
                    }
                }
                const groups = await sock.groupFetchAllParticipating();
                for (const gid of Object.keys(groups)) {
                    for (const p of (groups[gid].participants || [])) {
                        const pid = (p.id || '').split('@')[0].split(':')[0];
                        const pLid = (p.lid || '').split('@')[0].split(':')[0];
                        if ((pLid === raw || pid === raw) && pid && /^\d{7,15}$/.test(pid) && pid !== raw) return pid;
                    }
                }
            } catch {}
            return raw;
        }

        const fake = createFakeContact(msg);
        
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { 
                text: 'This command can only be used in groups!' 
            }, { quoted: fake });
            return;
        }

        const groupMetadata = await Promise.race([
            sock.groupMetadata(chatId),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout fetching group metadata')), 10000)
            )
        ]);

        if (!groupMetadata) {
            throw new Error('Failed to retrieve group metadata');
        }

        let pp;
        let ppError = false;
        try {
            pp = await sock.profilePictureUrl(chatId, 'image');
            if (!pp || typeof pp !== 'string') {
                throw new Error('Invalid profile picture URL');
            }
        } catch (error) {
            console.log('Profile picture error:', error.message);
            pp = 'https://i.imgur.com/2wzGhpF.jpeg';
            ppError = true;
        }

        const participants = groupMetadata.participants || [];
        const totalMembers = participants.length;
        
        const groupAdmins = participants.filter(p => 
            p.admin && (p.admin === 'admin' || p.admin === 'superadmin')
        );
        
        const owner = groupMetadata.owner || 
                     groupAdmins.find(p => p.admin === 'superadmin')?.id ||
                     participants.find(p => p.admin === 'superadmin')?.id ||
                     'Unknown';

        const adminLines = [];
        for (let i = 0; i < groupAdmins.length; i++) {
            const resolved = await resolveToPhone(sock, groupAdmins[i].id);
            adminLines.push(`${i + 1}. @${resolved}`);
        }
        const listAdmin = adminLines.length > 0 
            ? adminLines.join('\n')
            : 'No admins found';

        const creationDate = groupMetadata.creation ? 
            new Date(groupMetadata.creation * 1000).toLocaleDateString() : 
            'Unknown';

        const description = groupMetadata.desc 
            ? groupMetadata.desc.toString().trim()
            : 'No description';

        const maxDescLength = 500;
        const truncatedDesc = description.length > maxDescLength 
            ? description.substring(0, maxDescLength) + '...' 
            : description;

        const isAnnounce = groupMetadata.announce === true || groupMetadata.restrict === true;
        const groupMode = isAnnounce ? 'Restricted (Only admins can send messages)' : 'Everyone can send messages';

        const resolvedOwner = owner !== 'Unknown' ? await resolveToPhone(sock, owner) : 'Unknown';

        const text = `GROUP INFORMATION

Basic Info:
Name: ${groupMetadata.subject || 'Unnamed Group'}
ID: ${groupMetadata.id || 'Unknown'}
Created: ${creationDate}
Total Members: ${totalMembers}
Admins: ${groupAdmins.length}
Group Mode: ${groupMode}

Ownership:
Owner: @${resolvedOwner}

Administrators:
${listAdmin}

Description:
${truncatedDesc}

'You miss 100% of the shots you dont take' - Wayne Gretzky

${ppError ? 'Note: Using default group image' : ''}`.trim();

        const mentions = [];
        if (owner && owner !== 'Unknown') {
            mentions.push(owner);
        }
        
        groupAdmins.forEach(admin => {
            if (admin.id && !mentions.includes(admin.id) && admin.id !== owner) {
                mentions.push(admin.id);
            }
        });

        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: text,
            mentions: mentions
        }, { quoted: fake });

        console.log(`Group info command executed successfully for group: ${groupMetadata.subject}`);

    } catch (error) {
        console.error('Error in groupinfo command:', error);
        
        let errorMessage = 'Failed to get group info!';
        
        if (error.message.includes('Timeout')) {
            errorMessage = 'Request timeout. Please try again.';
        } else if (error.message.includes('not in group')) {
            errorMessage = 'Bot is not in this group or group not found.';
        } else if (error.message.includes('401')) {
            errorMessage = 'Unauthorized access to group information.';
        }

        const fake = createFakeContact(msg);
        await sock.sendMessage(chatId, { 
            text: errorMessage
        }, { quoted: fake });
    }
}

module.exports = groupInfoCommand;
