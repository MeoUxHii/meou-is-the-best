const { handleHunt, handleZoo } = require('../../games/rpg/hunt');
const { executeSellZoo, findAllMatchingAnimals } = require('../../games/rpg/zoo_market');
const { handleTeam, handleRename, handleBattle, handleBattleInfo, handleSetBattleCooldown } = require('../../games/rpg/battle');
const { HUNT_CONFIG } = require('../../config');

module.exports = {
    name: 'rpg',
    aliases: ['h', 'hunt', 'z', 'zoo', 'team', 'rename', 'b', 'battle', 'binfo', 'setbattlecd', 'ban', 'sell'],
    execute: async (message, cmd, args, client) => {
        if (cmd === 'h' || cmd === 'hunt') await handleHunt(message);
        else if (cmd === 'z' || cmd === 'zoo') await handleZoo(message, args);
        else if (cmd === 'team') await handleTeam(message, args);
        else if (cmd === 'rename') await handleRename(message, args);
        else if (['b', 'battle'].includes(cmd)) await handleBattle(message);
        else if (cmd === 'binfo') await handleBattleInfo(message, args);
        else if (cmd === 'setbattlecd') await handleSetBattleCooldown(message, args);      
        else if (cmd === 'ban' || cmd === 'sell') {          
        }
    }
};