const axios = require('axios');
const { createFakeContact, getBotName } = require('../../davelib/fakeContact');

// Helper function to try multiple APIs
async function tryAPIs(apis) {
    for (const api of apis) {
        try {
            let res;
            if (api.method === 'POST') {
                res = await axios.post(api.url, api.body, { 
                    timeout: 15000,
                    headers: api.headers || {} 
                });
            } else {
                res = await axios.get(api.url, { 
                    timeout: 15000,
                    headers: api.headers || {} 
                });
            }
            
            // Handle different response formats
            const result = api.parse(res.data);
            if (result && typeof result === 'string' && result.trim().length > 0) {
                return result.substring(0, 3000);
            }
        } catch (e) {
            // Silently fail and try next API
        }
    }
    return null;
}

// ==================== DEEPSEEK (FIXED - WORKING) ====================
async function deepseekCommand(sock, chatId, message, args) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    const query = args.join(' ').trim();

    if (!query) {
        return sock.sendMessage(chatId, { 
            text: `*${botName} DEEPSEEK*\n\nUsage: .deepseek <question>\nExample: .deepseek explain neural networks` 
        }, { quoted: fake });
    }

    await sock.sendMessage(chatId, { react: { text: '🔍', key: message.key } });

    // FIXED: Only working Deepseek APIs
    const result = await tryAPIs([
        { 
            url: `https://api.dreaded.site/api/deepseek?text=${encodeURIComponent(query)}`, 
            parse: d => d.response || d.result || d.message 
        },
        { 
            url: `https://bk9.fun/ai/deepseek?q=${encodeURIComponent(query)}`, 
            parse: d => d.BK9 || d.result || d.data 
        }
    ]);

    if (result) {
        await sock.sendMessage(chatId, { text: result }, { quoted: fake });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } else {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nDeepSeek is currently unavailable. Try again later.` 
        }, { quoted: fake });
    }
}

// ==================== LLAMA (WORKING) ====================
async function llamaCommand(sock, chatId, message, args) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    const query = args.join(' ').trim();

    if (!query) {
        return sock.sendMessage(chatId, { 
            text: `*${botName} LLAMA*\n\nUsage: .llama <question>\nExample: .llama write a python hello world` 
        }, { quoted: fake });
    }

    await sock.sendMessage(chatId, { react: { text: '🦙', key: message.key } });

    const result = await tryAPIs([
        { url: `https://bk9.fun/ai/llama?q=${encodeURIComponent(query)}`, parse: d => d.BK9 || d.result },
        { url: `https://api.dreaded.site/api/llama?text=${encodeURIComponent(query)}`, parse: d => d.response || d.result },
        { url: `https://api.siputzx.my.id/api/ai/llama33-70b?content=${encodeURIComponent(query)}`, parse: d => d.data },
    ]);

    if (result) {
        await sock.sendMessage(chatId, { text: result }, { quoted: fake });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } else {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nLlama is currently unavailable. Try again later.` 
        }, { quoted: fake });
    }
}

// ==================== MIXTRAL (WORKING) ====================
async function mixtralCommand(sock, chatId, message, args) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    const query = args.join(' ').trim();

    if (!query) {
        return sock.sendMessage(chatId, { 
            text: `*${botName} MIXTRAL*\n\nUsage: .mixtral <question>\nExample: .mixtral explain APIs` 
        }, { quoted: fake });
    }

    await sock.sendMessage(chatId, { react: { text: '🔮', key: message.key } });

    const result = await tryAPIs([
        { url: `https://bk9.fun/ai/mixtral?q=${encodeURIComponent(query)}`, parse: d => d.BK9 || d.result },
        { url: `https://api.siputzx.my.id/api/ai/mixtral-8x7b?content=${encodeURIComponent(query)}`, parse: d => d.data },
    ]);

    if (result) {
        await sock.sendMessage(chatId, { text: result }, { quoted: fake });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } else {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nMixtral is currently unavailable. Try again later.` 
        }, { quoted: fake });
    }
}

// ==================== QWEN (WORKING) ====================
async function qwenCommand(sock, chatId, message, args) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    const query = args.join(' ').trim();

    if (!query) {
        return sock.sendMessage(chatId, { 
            text: `*${botName} QWEN*\n\nUsage: .qwen <question>\nExample: .qwen what is machine learning` 
        }, { quoted: fake });
    }

    await sock.sendMessage(chatId, { react: { text: '🐉', key: message.key } });

    const result = await tryAPIs([
        { url: `https://bk9.fun/ai/qwen?q=${encodeURIComponent(query)}`, parse: d => d.BK9 || d.result },
        { url: `https://api.siputzx.my.id/api/ai/qwen2.5-32b?content=${encodeURIComponent(query)}`, parse: d => d.data },
    ]);

    if (result) {
        await sock.sendMessage(chatId, { text: result }, { quoted: fake });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } else {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nQwen is currently unavailable. Try again later.` 
        }, { quoted: fake });
    }
}

// ==================== CLAUDE (WORKING) ====================
async function claudeCommand(sock, chatId, message, args) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    const query = args.join(' ').trim();

    if (!query) {
        return sock.sendMessage(chatId, { 
            text: `*${botName} CLAUDE*\n\nUsage: .claude <question>\nExample: .claude explain recursion` 
        }, { quoted: fake });
    }

    await sock.sendMessage(chatId, { react: { text: '🤖', key: message.key } });

    const result = await tryAPIs([
        { url: `https://bk9.fun/ai/claude?q=${encodeURIComponent(query)}`, parse: d => d.BK9 || d.result },
        { url: `https://api.dreaded.site/api/claude?text=${encodeURIComponent(query)}`, parse: d => d.response || d.result },
    ]);

    if (result) {
        await sock.sendMessage(chatId, { text: result }, { quoted: fake });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } else {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nClaude is currently unavailable. Try again later.` 
        }, { quoted: fake });
    }
}

// ==================== GPT-4O (WORKING) ====================
async function gpt4oCommand(sock, chatId, message, args) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    const query = args.join(' ').trim();

    if (!query) {
        return sock.sendMessage(chatId, { 
            text: `*${botName} GPT-4O*\n\nUsage: .gpt4o <question>\nExample: .gpt4o explain blockchain` 
        }, { quoted: fake });
    }

    await sock.sendMessage(chatId, { react: { text: '⚡', key: message.key } });

    const result = await tryAPIs([
        { url: `https://bk9.fun/ai/GPT4o?q=${encodeURIComponent(query)}`, parse: d => d.BK9 || d.result },
        { url: `https://api.dreaded.site/api/chatgpt?text=${encodeURIComponent(query)}`, parse: d => d.response || d.result },
        { url: `https://api.siputzx.my.id/api/ai/gpt-4o?content=${encodeURIComponent(query)}`, parse: d => d.data },
    ]);

    if (result) {
        await sock.sendMessage(chatId, { text: result }, { quoted: fake });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } else {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nGPT-4o is currently unavailable. Try again later.` 
        }, { quoted: fake });
    }
}

// ==================== MISTRAL (WORKING) ====================
async function mistralCommand(sock, chatId, message, args) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    const query = args.join(' ').trim();

    if (!query) {
        return sock.sendMessage(chatId, { 
            text: `*${botName} MISTRAL*\n\nUsage: .mistral <question>\nExample: .mistral explain docker containers` 
        }, { quoted: fake });
    }

    await sock.sendMessage(chatId, { react: { text: '🌬️', key: message.key } });

    const result = await tryAPIs([
        { url: `https://bk9.fun/ai/mistral?q=${encodeURIComponent(query)}`, parse: d => d.BK9 || d.result },
        { url: `https://api.siputzx.my.id/api/ai/mistral-nemo?content=${encodeURIComponent(query)}`, parse: d => d.data },
    ]);

    if (result) {
        await sock.sendMessage(chatId, { text: result }, { quoted: fake });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } else {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nMistral is currently unavailable. Try again later.` 
        }, { quoted: fake });
    }
}

// ==================== GEMMA (WORKING) ====================
async function gemmaCommand(sock, chatId, message, args) {
    const fake = createFakeContact(message);
    const botName = getBotName();
    const query = args.join(' ').trim();

    if (!query) {
        return sock.sendMessage(chatId, { 
            text: `*${botName} GEMMA*\n\nUsage: .gemma <question>\nExample: .gemma explain REST APIs` 
        }, { quoted: fake });
    }

    await sock.sendMessage(chatId, { react: { text: '💎', key: message.key } });

    const result = await tryAPIs([
        { url: `https://bk9.fun/ai/gemma?q=${encodeURIComponent(query)}`, parse: d => d.BK9 || d.result },
        { url: `https://api.siputzx.my.id/api/ai/gemma2-9b?content=${encodeURIComponent(query)}`, parse: d => d.data },
    ]);

    if (result) {
        await sock.sendMessage(chatId, { text: result }, { quoted: fake });
        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
    } else {
        await sock.sendMessage(chatId, { 
            text: `*${botName}*\nGemma is currently unavailable. Try again later.` 
        }, { quoted: fake });
    }
}

// ==================== EXPORTS (EXACTLY AS BEFORE) ====================
module.exports = {
    deepseekCommand,
    llamaCommand,
    mixtralCommand,
    qwenCommand,
    claudeCommand,
    gpt4oCommand,
    mistralCommand,
    gemmaCommand
};