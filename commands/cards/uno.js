const { handleUnoCommand } = require('../../games/cards/uno_game');

module.exports = {
    name: 'uno',
    aliases: ['uno'],
    gameType: 'uno', 
    execute: async (message, cmd, args, client) => {
        await handleUnoCommand(message, args);
    }
};