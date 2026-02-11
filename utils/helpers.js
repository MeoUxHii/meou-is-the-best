const { EmbedBuilder } = require('discord.js');
const { SHOP_ITEMS } = require('../config');
const economy = require('./economy');
const { showUserSelection } = require('./selection_ui');

function parseBetAmount(str) {
    if (!str) return 0;
    str = str.toLowerCase();
    let multi = 1;
    if (str.endsWith('k')) { multi = 1000; str = str.slice(0, -1); } 
    else if (str.endsWith('m')) { multi = 1000000; str = str.slice(0, -1); }
    const val = parseFloat(str);
    return isNaN(val) ? 0 : Math.floor(val * multi);
}

function removeVietnameseTones(str) {
    if (!str) return "";
    str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, "a");
    str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, "e");
    str = str.replace(/ì|í|ị|ỉ|ĩ/g, "i");
    str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, "o");
    str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, "u");
    str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, "y");
    str = str.replace(/đ/g, "d");
    str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, "A");
    str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, "E");
    str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, "I");
    str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, "O");
    str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, "U");
    str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, "Y");
    str = str.replace(/Đ/g, "D");
    return str;
}

function findItemSmart(inputName) {
    if (!inputName) return null;
    const cleanInput = inputName.toLowerCase().trim();
    const cleanInputNoTone = removeVietnameseTones(cleanInput);

    return Object.values(SHOP_ITEMS).find(i => {
        const nameLower = i.name.toLowerCase();
        const nameNoTone = removeVietnameseTones(nameLower);
        if (i.keywords.some(k => k === cleanInput || k === cleanInputNoTone)) return true;
        if (nameLower.includes(cleanInput) || nameNoTone.includes(cleanInputNoTone)) return true;
        return false;
    });
}

function findAllItemsSmart(inputName) {
    if (!inputName) return [];
    const cleanInput = inputName.toLowerCase().trim();
    const cleanInputNoTone = removeVietnameseTones(cleanInput);

    return Object.values(SHOP_ITEMS).filter(i => {
        const nameLower = i.name.toLowerCase();
        const nameNoTone = removeVietnameseTones(nameLower);
        if (i.keywords.some(k => k === cleanInput || k === cleanInputNoTone)) return true;
        if (nameLower.includes(cleanInput) || nameNoTone.includes(cleanInputNoTone)) return true;
        return false;
    });
}

async function resolveGlobalUser(message, keyword) {
    if (!keyword) return null;
    const client = message.client;
    const cleanKey = keyword.toLowerCase().trim().replace(/^@/, '');

    const mentionMatch = keyword.match(/^<@!?(\d+)>$/);
    if (mentionMatch) return await client.users.fetch(mentionMatch[1]).catch(() => null);
    
    if (/^\d{17,19}$/.test(cleanKey)) {
        return await client.users.fetch(cleanKey).catch(() => null);
    }

    if (/^\d+$/.test(cleanKey) && cleanKey.length < 15) {
        return null; 
    }

    let candidates = new Map();

    const checkAndAdd = (user, nickname) => {
        if (!user) return; 

        const name = (user.username || "").toLowerCase();
        const global = (user.globalName || "").toLowerCase();
        const nick = (nickname || "").toLowerCase(); 

        if (name.includes(cleanKey) || global.includes(cleanKey) || nick.includes(cleanKey)) {
            candidates.set(user.id, user);
        }
    };

    if (message.guild) {
        message.guild.members.cache.forEach(m => checkAndAdd(m.user, m.nickname));
    }

    client.users.cache.forEach(u => { 
        if (!candidates.has(u.id)) checkAndAdd(u, null); 
    });

    if (economy.users) {
        for (const [uid, userData] of economy.users) {
            if (candidates.has(uid)) continue;
            
            const dbName = (userData.username || "").toLowerCase();
            const dbDisplay = (userData.display_name || "").toLowerCase();
            const dbId = uid;

            if (dbName.includes(cleanKey) || dbDisplay.includes(cleanKey) || dbId.includes(cleanKey)) {
                const mockUser = {
                    id: uid,
                    username: userData.username || "Unknown User",
                    globalName: userData.display_name || null,
                    discriminator: '0',
                    bot: false,
                    displayAvatarURL: () => userData.avatar 
                        ? `https://cdn.discordapp.com/avatars/${uid}/${userData.avatar}.png` 
                        : 'https://cdn.discordapp.com/embed/avatars/0.png',
                    toString: () => `<@${uid}>`
                };
                candidates.set(uid, mockUser);
            }
        }
    }

    const results = Array.from(candidates.values());
    if (results.length === 0) return null;


    const exactMatches = results.filter(u => 
        (u.username || "").toLowerCase() === cleanKey || 
        (u.globalName || "").toLowerCase() === cleanKey
    );
    if (exactMatches.length > 0) {
        if (exactMatches.length === 1) return exactMatches[0];
        return await showUserSelection(message, exactMatches);
    }

    const startMatches = results.filter(u => 
        (u.username || "").toLowerCase().startsWith(cleanKey) || 
        (u.globalName || "").toLowerCase().startsWith(cleanKey)
    );
    if (startMatches.length > 0) {
        if (startMatches.length === 1) return startMatches[0];
        return await showUserSelection(message, startMatches);
    }

    if (cleanKey.length <= 3 && results.length >= 5) {
        return null; 
    }

    if (results.length === 1) return results[0];

    return await showUserSelection(message, results);
}

async function checkChannel(message, gameType) {
    const allowedChannelId = await economy.getGameChannel(message.guild.id, gameType);
    if (allowedChannelId && message.channel.id !== allowedChannelId) {
        return false;
    }
    return true;
}

function sendLootboxMessage(channel, memberOrUser, itemKey, tracker) {
    const itemData = SHOP_ITEMS[itemKey];
    const userId = memberOrUser.id;
    const displayName = memberOrUser.displayName || memberOrUser.username;

    const currentCount = tracker ? tracker.count : 1;
    const resetTime = tracker ? tracker.resetTime : (Date.now() + 3600000);
    const remainingDrops = Math.max(0, 10 - currentCount); 
    const resetTimestampSeconds = Math.floor(resetTime / 1000);

    const embed = new EmbedBuilder()
        .setColor(itemKey === 'lootboxvip' ? 'Gold' : 'Blue') 
        .setDescription(
            `${itemData.emoji} | **${displayName}** đã nhận được x1 **${itemData.name}**\n` +
            `\`Còn lại [${remainingDrops}/10] Reset sau:\` <t:${resetTimestampSeconds}:R>\n` +
            `Hòm đã được cất vào kho đồ, sử dụng \`.inv\` để kiểm tra.`
        );

    channel.send({ content: `<@${userId}>`, embeds: [embed] }).catch(console.error);
}

module.exports = { 
    parseBetAmount, 
    removeVietnameseTones, 
    findItemSmart, 
    findAllItemsSmart,
    resolveGlobalUser,
    checkChannel,
    sendLootboxMessage 
};