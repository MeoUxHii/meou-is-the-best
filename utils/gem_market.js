
const { EmbedBuilder } = require('discord.js');
const { SHOP_ITEMS, CURRENCY, GEM_PRICE_RANGES } = require('../config');
const { MarketHistory } = require('../database/models');
const economy = require('./economy');



let currentMarketPrices = {};

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}


async function updateMarketPrices() {
    const oldPrices = { ...currentMarketPrices };
    const now = new Date();
    
    for (const [gemId, range] of Object.entries(GEM_PRICE_RANGES)) {
        const newPrice = getRandomInt(range.min, range.max);
        let trend = 'stable';
        
        if (oldPrices[gemId]) {
            if (newPrice > oldPrices[gemId].price) trend = 'up';
            else if (newPrice < oldPrices[gemId].price) trend = 'down';
        } else {
            trend = Math.random() > 0.5 ? 'up' : 'down';
        }

        currentMarketPrices[gemId] = {
            price: newPrice,
            trend: trend,
            name: SHOP_ITEMS[gemId].name,
            emoji: SHOP_ITEMS[gemId].emoji
        };

        try {
            let totalInServer = 0;
            if (economy.countItemInServer) {
                for (const [key, val] of economy.inventory) {
                    if (val.item_id === gemId) totalInServer += val.amount;
                }
            }

            await MarketHistory.create({
                gem_id: gemId,
                price: newPrice,
                total_in_server: totalInServer,
                time: now
            });

            const records = await MarketHistory.find({ gem_id: gemId }).sort({ time: -1 });
            if (records.length > 5) {
                const idsToDelete = records.slice(5).map(r => r._id);
                await MarketHistory.deleteMany({ _id: { $in: idsToDelete } });
            }

        } catch (e) {
            console.error(`[GemMarket] Lỗi lưu DB cho ${gemId}:`, e);
        }
    }
    
    const timeLog = now.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    console.log(`[GemMarket] Giá đá quý đã cập nhật lúc ${timeLog}`);
    return currentMarketPrices;
}

function getGemPrice(gemId) {
    if (!currentMarketPrices[gemId]) {
        return { price: 0, trend: 'stable', name: 'Loading...', emoji: '' };
    }
    return currentMarketPrices[gemId];
}


function getMarketEmbed() {
    if (Object.keys(currentMarketPrices).length === 0) return new EmbedBuilder().setDescription("Đang cập nhật thị trường...");

    const now = new Date();
    const timeString = now.toLocaleTimeString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false 
    });

    let description = "";

    
    const formatLine = (id) => {
        const data = currentMarketPrices[id];
        if (!data) return "";
        
        const maxPrice = GEM_PRICE_RANGES[id] ? GEM_PRICE_RANGES[id].max : 0;

        
        const nameFixed = data.name.padEnd(10, ' ');

        
        const priceFixed = data.price.toLocaleString('vi-VN').padEnd(7, ' ');

        
        const maxFixed = maxPrice.toLocaleString('vi-VN').padEnd(7, ' ');

        const trendIcon = data.trend === 'up' 
            ? '<:up:1461137151109632071>' 
            : (data.trend === 'down' ? '<:down:1461137149435973713>' : '➖');

        
        
        
        return `${data.emoji} \`${nameFixed} • ${priceFixed}\` ${CURRENCY} ${trendIcon} \`|${maxFixed}${CURRENCY}|\`\n`;
    };

    description += "\n";
    description += "**--- 🌟 NGỌC ĐA SẮC---**\n";
    description += "\n";
    description += formatLine('gem_special');
    description += "\n";

    description += "**--- 💎 NGỌC LOOTBOX ---**\n";
    const classicGems = ['gem7', 'gem6', 'gem5', 'gem4', 'gem3', 'gem2', 'gem1'];
    classicGems.forEach(id => description += formatLine(id));
    description += "\n";
    
    description += "**--- 🏺 NGỌC CRATE ---**\n";
    const seriesAGems = ['gem7a', 'gem6a', 'gem5a', 'gem4a', 'gem3a', 'gem2a', 'gem1a'];
    seriesAGems.forEach(id => description += formatLine(id));

    const embed = new EmbedBuilder()
        .setColor('Green')
        .setTitle(`**Bảng Giá Bảo Ngọc - ${timeString}**`)
        .setDescription(description)
        .setFooter({ text: "Giá cập nhật mỗi giờ"})
        .setTimestamp();
    return embed;
}

async function getGemHistoryEmbed(gemId) {
    const itemData = SHOP_ITEMS[gemId];
    if (!itemData) return new EmbedBuilder().setDescription("Không tìm thấy thông tin Gem.");

    const history = await MarketHistory.find({ gem_id: gemId }).sort({ time: -1 }).limit(5);
    
    let description = "----------------------------\n";
    let trendText = "Ổn định";

    if (history.length > 0) {
        const currentPrice = history[0].price;
        if (history.length > 1) {
            if (currentPrice > history[1].price) trendText = "**Tăng** 📈";
            else if (currentPrice < history[1].price) trendText = "**Giảm** 📉";
        }

        for (const record of history) {
            const timeStr = record.time.toLocaleTimeString('vi-VN', { 
                timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false 
            });
            description += `${timeStr} - Giá: **${record.price.toLocaleString('vi-VN')}** ${CURRENCY} (Tồn: ${record.total_in_server})\n`;
        }
    } else {
        description += "Chưa có dữ liệu lịch sử.\n";
    }
    
    description += "----------------------------\n";
    description += `Xu hướng: ${trendText}`;

    const now = new Date();
    const timeString = now.toLocaleTimeString('vi-VN', { 
        timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false 
    });

    const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle(`${itemData.name} ${itemData.emoji} - ${timeString}`)
        .setDescription(description);

    return embed;
}

function startMarketScheduler() {
    updateMarketPrices();
    setInterval(() => {
        const now = new Date();
        if (now.getMinutes() === 0) {
             updateMarketPrices();
        }
    }, 60000); 
}

module.exports = {
    startMarketScheduler,
    updateMarketPrices,
    getGemPrice,
    getMarketEmbed,
    getGemHistoryEmbed,
    currentMarketPrices
};