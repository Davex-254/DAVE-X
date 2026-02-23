const db = require('../Database/database');

function isBanned(userId) {
    try {
        return db.isBanned(userId);
    } catch (error) {
        console.error('Error checking banned status:', error);
        return false;
    }
}

module.exports = { isBanned };
