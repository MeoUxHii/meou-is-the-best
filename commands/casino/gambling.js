const { handleBauCua } = require('../../games/casino/baucua');
const { handleXiDach } = require('../../games/casino/xidach');
const { handleRoulette } = require('../../games/casino/roulette');
const { handleRace } = require('../../games/casino/duangua');
const { handleChicken } = require('../../games/casino/chicken');
const { handleRoll } = require('../../games/economy/lootbox'); 

module.exports = {
    name: 'gambling',
    aliases: ['xd', 'bj', 'dg', 'baucua', 'bc', 'rl', 'dua', 'roll'],
    gameType: 'baucua', 
    execute: async (message, cmd, args, client) => {
        if (cmd === 'xd' || cmd === 'bj') await handleXiDach(message, args);
        else if (cmd === 'dg') await handleChicken(message, args);
        else if (cmd === 'baucua' || cmd === 'bc') await handleBauCua(message, args, client);
        else if (cmd === 'rl') await handleRoulette(message, args);
        else if (cmd === 'dua') await handleRace(message);
        else if (cmd === 'roll') await handleRoll(message, args);
    }
};