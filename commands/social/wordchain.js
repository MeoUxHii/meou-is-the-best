const { handleWordChain } = require('../../games/social/wordchain');

module.exports = {
    name: 'wordchain',
    aliases: ['start', 'stop', 'mode', 'rank', 'setwordpayout', 'set-word-payout'], 
    gameType: 'noitu',
    execute: async (message, cmd, args, client) => {
        await handleWordChain(message, '.' + cmd, args);
    }
};