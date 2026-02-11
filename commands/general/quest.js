const { handleMissionCommand } = require('../../games/mission');

module.exports = {
    name: 'quest',
    aliases: ['nv', 'nhiemvu', 'mission', 'dailyquest'],
    execute: async (message, cmd, args, client) => {
        await handleMissionCommand(message);
    }
};