class TicTacToe {
    constructor(playerX = 'X', playerO = 'O') {
        this.playerX = playerX;
        this.playerO = playerO;
        this._isOTurn = false;
        this._xMoves = 0;
        this._oMoves = 0;
        this.turns = 0;
    }

    get board() {
        return this._xMoves | this._oMoves;
    }

    get currentTurn() {
        return this._isOTurn ? this.playerO : this.playerX;
    }

    get winner() {
        const winningPatterns = [
            0b111000000, 0b000111000, 0b000000111,
            0b100100100, 0b010010010, 0b001001001,
            0b100010001, 0b001010100
        ];
        for (let pattern of winningPatterns) {
            if ((this._xMoves & pattern) === pattern) return this.playerX;
            if ((this._oMoves & pattern) === pattern) return this.playerO;
        }
        return null;
    }

    get isDraw() {
        return this.turns === 9 && !this.winner;
    }

    turn(isO, pos) {
        if (this.winner || this.isDraw) return false;
        if (pos < 0 || pos > 8) return false;
        if (this.board & (1 << pos)) return false;
        if (isO !== this._isOTurn) return false;

        const move = 1 << pos;
        if (this._isOTurn) {
            this._oMoves |= move;
        } else {
            this._xMoves |= move;
        }
        this._isOTurn = !this._isOTurn;
        this.turns++;
        return true;
    }

    getAvailableMoves() {
        const moves = [];
        for (let i = 0; i < 9; i++) {
            if (!(this.board & (1 << i))) moves.push(i);
        }
        return moves;
    }

    render() {
        return [...Array(9)].map((_, i) => {
            const bit = 1 << i;
            if (this._xMoves & bit) return 'X';
            if (this._oMoves & bit) return 'O';
            return String(i + 1);
        });
    }

    findBestMove() {
        const available = this.getAvailableMoves();
        if (available.length === 0) return -1;

        const winPatterns = [
            [0,1,2],[3,4,5],[6,7,8],
            [0,3,6],[1,4,7],[2,5,8],
            [0,4,8],[2,4,6]
        ];
        const board = this.render();
        const aiSymbol = this._isOTurn ? 'O' : 'X';
        const humanSymbol = this._isOTurn ? 'X' : 'O';

        for (const pattern of winPatterns) {
            const cells = pattern.map(i => board[i]);
            const aiCount = cells.filter(c => c === aiSymbol).length;
            const emptyIdx = pattern.find(i => board[i] !== 'X' && board[i] !== 'O');
            if (aiCount === 2 && emptyIdx !== undefined) return emptyIdx;
        }

        for (const pattern of winPatterns) {
            const cells = pattern.map(i => board[i]);
            const humanCount = cells.filter(c => c === humanSymbol).length;
            const emptyIdx = pattern.find(i => board[i] !== 'X' && board[i] !== 'O');
            if (humanCount === 2 && emptyIdx !== undefined) return emptyIdx;
        }

        if (available.includes(4)) return 4;
        const corners = [0, 2, 6, 8].filter(c => available.includes(c));
        if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];
        return available[Math.floor(Math.random() * available.length)];
    }
}

module.exports = TicTacToe;
