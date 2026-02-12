const { EmbedBuilder } = require('discord.js');
const economy = require('../utils/economy');
const { SHOP_ITEMS, CURRENCY } = require('../config');

const xpCooldowns = new Map();
const COOLDOWN_SECONDS = 20; 
const DAILY_LIMIT = 1000;
const DAILY_BONUS = 50;

function getRequiredXP(level) {
    return 500 + Math.pow(level * 7, 2);
}

function getLevelRewards(level) {
    let coin = 2000;
    let lb = 5;
    let crate = 5;
    let lbvip = 1;
    let cratel = 1;

    if (level > 1) {
        const multipliers = level - 1;
        coin += multipliers * 1000;
        lb += multipliers * 1;
        crate += multipliers * 1;
        lbvip += multipliers * 1;
        cratel += multipliers * 1;
    }
    return { coin, lb, crate, lbvip, cratel };
}

async function processLevelUp(message, userId, user) {
    let levelUpOccurred = false;
    let rewardText = "";
    
    
    while (true) {
        const needed = getRequiredXP(user.level);
        if (user.xp >= needed) {
            user.level++;
            levelUpOccurred = true;

            const rewards = getLevelRewards(user.level);
            
            await economy.addMoney(userId, rewards.coin, `Level Up ${user.level}`);
            await economy.addItem(userId, 'lootbox', rewards.lb);
            await economy.addItem(userId, 'crate', rewards.crate);
            await economy.addItem(userId, 'lootboxvip', rewards.lbvip);
            await economy.addItem(userId, 'crateL', rewards.cratel);

            rewardText = 
            `**+ ${rewards.coin.toLocaleString('vi-VN')} ${CURRENCY}**\n` +
            `**+ ${rewards.lb}** ${SHOP_ITEMS.lootbox.emoji} **+ ${rewards.crate}** ${SHOP_ITEMS.crate.emoji}\n` +
            `**+ ${rewards.lbvip}** ${SHOP_ITEMS.lootboxvip.emoji} **+ ${rewards.cratel}** ${SHOP_ITEMS.crateL.emoji}`;
        } else {
            break;
        }
    }

    if (levelUpOccurred) {
        
        await economy.saveUserLevel(userId, user);

        const nextLevelXP = getRequiredXP(user.level);
        const xpMissing = Math.max(0, nextLevelXP - user.xp);
        const avatarUrl = message.author.displayAvatarURL({ extension: 'png', size: 128 });

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setAuthor({ name: `LEVEL UP!`, iconURL: avatarUrl })
            .setDescription(
                `🎁 **PHẦN THƯỞNG:**\n` +
                `${rewardText}`
            )
            .setThumbnail(avatarUrl)
            .setFooter({ text: `Cấp độ tiếp theo cần thêm ${xpMissing.toLocaleString('vi-VN')} XP nữa.` });

        message.channel.send({ 
            content: `🎉|Chúc mừng ${message.author.toString()} đã đạt Cấp độ ${user.level}!`, 
            embeds: [embed] 
        }).catch(() => {});
    }
}

async function handleLevelSystem(message) {
    if (message.author.bot) return;
    const userId = message.author.id;
    
    
    const now = Date.now();
    if (xpCooldowns.has(userId)) {
        if (now < xpCooldowns.get(userId)) return;
    }
    xpCooldowns.set(userId, now + (COOLDOWN_SECONDS * 1000));

    let user = await economy.getUser(userId);
    
    
    
    if (user.xp === undefined || user.xp === null || isNaN(user.xp)) user.xp = 0;
    if (user.level === undefined || user.level === null || isNaN(user.level)) user.level = 0;
    if (user.daily_xp === undefined || user.daily_xp === null || isNaN(user.daily_xp)) user.daily_xp = 0;
    
    user.xp = Number(user.xp);
    user.level = Number(user.level);
    user.daily_xp = Number(user.daily_xp);
    
    if (!user.last_xp_date) user.last_xp_date = "";

    const todayStr = new Date(now + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
    let addedXP = 0;

    
    if (user.last_xp_date !== todayStr) {
        user.daily_xp = 0;
        user.last_xp_date = todayStr;
        addedXP += DAILY_BONUS;
    }

    
    if (user.daily_xp >= DAILY_LIMIT) {
        if (addedXP > 0) {
             user.xp += addedXP;
             await economy.saveUserLevel(userId, user); 
        }
        return;
    }

    const randomXP = Math.floor(Math.random() * (15 - 10 + 1)) + 10;
    let actualXP = randomXP;

    if (user.daily_xp + actualXP > DAILY_LIMIT) {
        actualXP = DAILY_LIMIT - user.daily_xp;
    }

    
    user.daily_xp += actualXP;
    user.xp += (actualXP + addedXP);

    
    
    await economy.saveUserLevel(userId, user);

    
    await processLevelUp(message, userId, user);
}

async function addXpBackdoor(message, amount) {
    const userId = message.author.id;
    let user = await economy.getUser(userId);
    
    user.xp = Number(user.xp) || 0;
    user.level = Number(user.level) || 0;
    
    user.xp += Number(amount);
    
    
    await economy.saveUserLevel(userId, user);
    await processLevelUp(message, userId, user);
}


module.exports = { handleLevelSystem, addXpBackdoor, getRequiredXP };
