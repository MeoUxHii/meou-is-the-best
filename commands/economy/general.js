const { handleEconomyCommand, COMMAND_ALIASES } = require('../../games/economy/economy_game');

module.exports = {
    name: 'economy',

    aliases: ['work','w','slut','s','crime','c','rob','bal','balance','dep','deposit','cat','with','withdraw','lay','give','givemoney','give-money','lb','leaderboard','addmoney','add-money','removemoney','remove-money','addmoneyrole','removemoneyrole','addmoneyall','resetmoney','setcooldown','setpayout','setfailrate','setcurrency','setstartbalance','prefix','disable','enable','gentestusers','removetestusers', 'daily', 'diemdanh', 'checkin', 'setchanel', 'set-channel'],
    execute: async (message, cmd, args, client) => {
        await handleEconomyCommand(message, cmd, args);
    }
};