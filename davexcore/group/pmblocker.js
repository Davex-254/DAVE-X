const { getOwnerConfig, setOwnerConfig } = require('../../Database/settingsStore');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

const DEFAULT_MESSAGE = '⚠️ Direct messages are blocked!\nYou cannot DM this bot. Please contact the owner in group chats only.';

function readState() {
    try {
        const config = getOwnerConfig('pmblocker');
        if (!config || typeof config !== 'object') {
            return { enabled: false, message: DEFAULT_MESSAGE };
        }
        return {
            enabled: !!config.enabled,
            message: typeof config.message === 'string' && config.message.trim() ? config.message : DEFAULT_MESSAGE
        };
    } catch {
        return { enabled: false, message: DEFAULT_MESSAGE };
    }
}

function writeState(enabled, message) {
    try {
        const current = readState();
        const payload = {
            enabled: !!enabled,
            message: typeof message === 'string' && message.trim() ? message : current.message
        };
        setOwnerConfig('pmblocker', payload);
    } catch {}
}

async function pmblockerCommand(sock, chatId, message, args) {
    const argStr = (args || '').trim();
    const [sub, ...rest] = argStr.split(' ');
    const state = readState();

    if (!sub || !['on', 'off', 'status', 'setmsg'].includes(sub.toLowerCase())) {
        await sock.sendMessage(chatId, { text: '*☣️ AUTO-BLOCK ☣️*\n\n 🔸.pmblocker on - Enable PM auto-block\n 🔸.pmblocker off - Disable PM blocker\n 🔸 .pmblocker status - Show current status\n 🔸 .pmblocker setmsg <text> - Set warning message' }, { quoted: fakeContact });
        return;
    }

    if (sub.toLowerCase() === 'status') {
        await sock.sendMessage(chatId, { text: `PM Blocker is currently *${state.enabled ? 'ON' : 'OFF'}*\nMessage: ${state.message}` }, { quoted: fakeContact });
        return;
    }

    if (sub.toLowerCase() === 'setmsg') {
        const newMsg = rest.join(' ').trim();
        if (!newMsg) {
            await sock.sendMessage(chatId, { text: 'Usage: .pmblocker setmsg <message>' }, { quoted: fakeContact });
            return;
        }
        writeState(state.enabled, newMsg);
        await sock.sendMessage(chatId, { text: 'PM Blocker message updated.' }, { quoted: fakeContact });
        return;
    }

    const enable = sub.toLowerCase() === 'on';
    writeState(enable);
    await sock.sendMessage(chatId, { text: `PM Blocker is now *${enable ? 'ENABLED' : 'DISABLED'}*.` }, { quoted: fakeContact });
}

module.exports = { pmblockerCommand, readState };


