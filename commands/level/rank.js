const { EmbedBuilder } = require('discord.js');
const economy = require('../../utils/economy');
const { getRequiredXP } = require('../../games/level');

module.exports = {
    name: 'me', 
    aliases: ['level', 'lv', 'xp'], 
    execute: async (message, cmd, args, client) => {
        const targetUser = message.mentions.users.first() || message.author;
        const userId = targetUser.id;
        const userData = await economy.getUser(userId);
        const currentLevel = userData.level || 0;
        const currentXP = userData.xp || 0;
        const xpForNextLevel = getRequiredXP(currentLevel);
        const xpMissing = Math.max(0, xpForNextLevel - currentXP); 
        const avatarUrl = targetUser.displayAvatarURL({ extension: 'png', size: 256 });
        const embed = new EmbedBuilder()
            .setColor('Blue') 
            .setAuthor({ name: 'Thông tin cấp độ', iconURL: avatarUrl })
            .setThumbnail(avatarUrl)
            .setDescription(
                `Cấp độ hiện tại của bạn là: **${currentLevel}**\n` +
                `Cấp độ tiếp theo cần: **${xpMissing.toLocaleString('vi-VN')} XP**`
            ); 
        return message.channel.send({ content: `${targetUser}`, embeds: [embed] });
    }
};