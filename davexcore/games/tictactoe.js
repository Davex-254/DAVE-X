const TicTacToe = require('../../davelib/tictactoe');

const games = {};
const gameTimeouts = {};
const BOT_JID = 'bot@s.whatsapp.net';

function renderBoard(arr) {
    const emojiMap = {
        'X': '❌', 'O': '⭕',
        '1': '1️⃣', '2': '2️⃣', '3': '3️⃣',
        '4': '4️⃣', '5': '5️⃣', '6': '6️⃣',
        '7': '7️⃣', '8': '8️⃣', '9': '9️⃣',
    };
    const mapped = arr.map(v => emojiMap[v] || v);
    return `${mapped.slice(0, 3).join('')}\n${mapped.slice(3, 6).join('')}\n${mapped.slice(6).join('')}`;
}

function clearGameTimeout(chatId) {
    if (gameTimeouts[chatId]) {
        clearTimeout(gameTimeouts[chatId]);
        delete gameTimeouts[chatId];
    }
}

function getPlayerName(jid) {
    return (jid || '').split(':')[0].split('@')[0];
}

async function tictactoeCommand(sock, chatId, senderId, text, fake) {
    try {
        if (Object.values(games).find(room =>
            room.id.startsWith('tictactoe') &&
            [room.game.playerX, room.game.playerO].includes(senderId)
        )) {
            await sock.sendMessage(chatId, {
                text: '❌ You are still in a game. Type *surrender* to quit.'
            }, { quoted: fake });
            return;
        }

        let room = Object.values(games).find(room =>
            room.state === 'WAITING' && room.chatId === chatId &&
            (text ? room.name === text : true)
        );

        if (room) {
            room.game.playerO = senderId;
            room.state = 'PLAYING';
            clearGameTimeout(chatId);

            const arr = room.game.render();
            const boardStr = renderBoard(arr);

            await sock.sendMessage(chatId, {
                text: `🎮 *TIC TAC TOE - Game Started!*\n\nPlayer ❌: @${getPlayerName(room.game.playerX)}\nPlayer ⭕: @${getPlayerName(senderId)}\n\nWaiting for @${getPlayerName(room.game.currentTurn)} to play...\n\n${boardStr}\n\n_Type a number (1-9) to place your symbol_\n_Type *surrender* to give up_`,
                mentions: [room.game.playerX, senderId, room.game.currentTurn]
            });
        } else {
            room = {
                id: 'tictactoe-' + (+new Date),
                chatId: chatId,
                game: new TicTacToe(senderId, 'o'),
                state: 'WAITING',
                isAI: false,
            };
            if (text) room.name = text;

            await sock.sendMessage(chatId, {
                text: `🎮 *TIC TAC TOE*\n\n@${getPlayerName(senderId)} wants to play!\n\n*Type "join" within 60 seconds to play!*\n\nPlayer ❌: @${getPlayerName(senderId)}\nPlayer ⭕: Waiting...\n\n${renderBoard(room.game.render())}\n\n_Auto-cancels in 60 seconds if no one joins_`,
                mentions: [senderId]
            }, { quoted: fake });

            games[room.id] = room;

            gameTimeouts[chatId] = setTimeout(async () => {
                const r = Object.values(games).find(g => g.chatId === chatId && g.state === 'WAITING');
                if (r) {
                    delete games[r.id];
                    await sock.sendMessage(chatId, {
                        text: `⏰ *TIC TAC TOE - TIMEOUT*\n\nNo one joined within 60 seconds.\nGame cancelled!\n\n@${getPlayerName(r.game.playerX)} can start a new game with *.ttt*`,
                        mentions: [r.game.playerX]
                    });
                }
            }, 60000);
        }
    } catch (error) {
        console.error('Error in tictactoe command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error starting game. Please try again.' });
    }
}

async function tictactoeAICommand(sock, chatId, senderId, fake) {
    try {
        if (Object.values(games).find(room =>
            room.id.startsWith('tictactoe') &&
            [room.game.playerX, room.game.playerO].includes(senderId)
        )) {
            await sock.sendMessage(chatId, {
                text: '❌ You are still in a game. Type *surrender* to quit.'
            }, { quoted: fake });
            return;
        }

        const room = {
            id: 'tictactoe-ai-' + (+new Date),
            chatId: chatId,
            game: new TicTacToe(senderId, BOT_JID),
            state: 'PLAYING',
            isAI: true,
        };

        games[room.id] = room;

        const arr = room.game.render();
        await sock.sendMessage(chatId, {
            text: `🎮 *TIC TAC TOE vs AI* 🤖\n\nPlayer ❌: @${getPlayerName(senderId)}\nPlayer ⭕: DAVE-X Bot 🤖\n\nYour turn! Type a number (1-9)\n\n${renderBoard(arr)}\n\n_Type *surrender* to give up_`,
            mentions: [senderId]
        }, { quoted: fake });
    } catch (error) {
        console.error('Error in tictactoe AI command:', error);
        await sock.sendMessage(chatId, { text: '❌ Error starting AI game.' });
    }
}

async function handleTicTacToeJoin(sock, chatId, senderId) {
    const room = Object.values(games).find(room =>
        room.state === 'WAITING' && room.chatId === chatId &&
        room.game.playerX !== senderId
    );
    if (!room) return false;

    room.game.playerO = senderId;
    room.state = 'PLAYING';
    clearGameTimeout(chatId);

    const arr = room.game.render();
    await sock.sendMessage(chatId, {
        text: `🎮 *TIC TAC TOE - Game Started!*\n\nPlayer ❌: @${getPlayerName(room.game.playerX)}\nPlayer ⭕: @${getPlayerName(senderId)}\n\nWaiting for @${getPlayerName(room.game.currentTurn)} to play...\n\n${renderBoard(arr)}\n\n_Type a number (1-9) to place your symbol_\n_Type *surrender* to give up_`,
        mentions: [room.game.playerX, senderId, room.game.currentTurn]
    });
    return true;
}

async function handleTicTacToeMove(sock, chatId, senderId, text) {
    try {
        const room = Object.values(games).find(room =>
            room.id.startsWith('tictactoe') &&
            [room.game.playerX, room.game.playerO].includes(senderId) &&
            room.state === 'PLAYING'
        );
        if (!room) return false;

        const isSurrender = /^(surrender|give\s?up)$/i.test(text);
        if (!isSurrender && !/^[1-9]$/.test(text)) return false;

        if (isSurrender) {
            const winner = senderId === room.game.playerX ? room.game.playerO : room.game.playerX;
            const winnerLabel = room.isAI && winner === BOT_JID ? 'DAVE-X Bot 🤖' : `@${getPlayerName(winner)}`;
            await sock.sendMessage(chatId, {
                text: `🏳️ @${getPlayerName(senderId)} has surrendered! ${winnerLabel} wins!`,
                mentions: [senderId, winner]
            });
            delete games[room.id];
            return true;
        }

        if (senderId !== room.game.currentTurn) {
            await sock.sendMessage(chatId, { text: '❌ Not your turn!' });
            return true;
        }

        const isO = senderId === room.game.playerO;
        const ok = room.game.turn(isO, parseInt(text) - 1);
        if (!ok) {
            await sock.sendMessage(chatId, { text: '❌ Invalid move! That position is already taken.' });
            return true;
        }

        let winner = room.game.winner;
        let isTie = room.game.isDraw;

        if (!winner && !isTie && room.isAI && room.game.currentTurn === BOT_JID) {
            const aiMove = room.game.findBestMove();
            if (aiMove >= 0) {
                room.game.turn(true, aiMove);
                winner = room.game.winner;
                isTie = room.game.isDraw;
            }
        }

        const arr = room.game.render();
        let gameStatus;
        if (winner) {
            if (room.isAI && winner === BOT_JID) {
                gameStatus = '🤖 DAVE-X Bot wins! Better luck next time!';
            } else {
                gameStatus = `🎉 @${getPlayerName(winner)} wins the game!`;
            }
        } else if (isTie) {
            gameStatus = '🤝 Game ended in a draw!';
        } else {
            const nextPlayer = room.isAI && room.game.currentTurn === BOT_JID
                ? 'DAVE-X Bot 🤖' : `@${getPlayerName(room.game.currentTurn)}`;
            gameStatus = `Turn: ${nextPlayer}`;
        }

        const p1Label = `@${getPlayerName(room.game.playerX)}`;
        const p2Label = room.isAI ? 'DAVE-X Bot 🤖' : `@${getPlayerName(room.game.playerO)}`;

        await sock.sendMessage(chatId, {
            text: `🎮 *TIC TAC TOE${room.isAI ? ' vs AI' : ''}*\n\n${gameStatus}\n\n${renderBoard(arr)}\n\nPlayer ❌: ${p1Label}\nPlayer ⭕: ${p2Label}\n\n${!winner && !isTie ? '_Type a number (1-9) to make your move_\n_Type *surrender* to give up_' : ''}`,
            mentions: [room.game.playerX, room.game.playerO, ...(winner && winner !== BOT_JID ? [winner] : []), room.game.currentTurn]
        });

        if (winner || isTie) {
            delete games[room.id];
        }
        return true;
    } catch (error) {
        console.error('Error in tictactoe move:', error);
        return false;
    }
}

async function tictactoeEndCommand(sock, chatId, senderId, fake) {
    const room = Object.values(games).find(room =>
        room.id.startsWith('tictactoe') &&
        (room.chatId === chatId) &&
        (room.game.playerX === senderId || room.game.playerO === senderId || room.state === 'WAITING')
    );
    if (!room) {
        await sock.sendMessage(chatId, { text: '❌ No active TicTacToe game to end!' }, { quoted: fake });
        return;
    }
    clearGameTimeout(chatId);
    delete games[room.id];
    await sock.sendMessage(chatId, {
        text: `🛑 TicTacToe game ended by @${getPlayerName(senderId)}!`,
        mentions: [senderId]
    });
}

function hasTTTGame(chatId) {
    return !!Object.values(games).find(room =>
        room.chatId === chatId && room.state === 'PLAYING'
    );
}

function hasWaitingTTTGame(chatId) {
    return !!Object.values(games).find(room =>
        room.chatId === chatId && room.state === 'WAITING'
    );
}

module.exports = {
    tictactoeCommand,
    tictactoeAICommand,
    handleTicTacToeMove,
    handleTicTacToeJoin,
    tictactoeEndCommand,
    hasTTTGame,
    hasWaitingTTTGame,
};
