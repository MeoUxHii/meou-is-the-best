module.exports = {
    name: 'help',
    aliases: ['help'],
    execute: async (message, cmd, args, client) => {
        return message.reply("**Danh Sách Lệnh | Command List**\n\nhttps://meouxhii.github.io/meoubot/\n\n**Server Hỗ Trợ | Support Server**\n\nhttps://discord.gg/GERM7nF6");
    }
};