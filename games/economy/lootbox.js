
const { EmbedBuilder } = require('discord.js');
const { SHOP_ITEMS, GEM_RATES, GEM_RATES_VIP, GEM_RATES_CRATE, GEM_RATES_CRATE_L, CURRENCY, GEM_PRICE_RANGES } = require('../../config');
const economy = require('../../utils/economy');
const { updateMissionProgress } = require('../mission'); 


const rollWaitList = {};
const openingSessions = new Map(); 

function getOpeningSession(userId) {
    return openingSessions.get(userId);
}


async function activateLuckyBox(message, userId, item) {
    rollWaitList[userId] = true;
    const embed = new EmbedBuilder()
        .setColor('Purple')
        .setTitle(`📦 ĐÃ MỞ ${item.name.toUpperCase()}`)
        .setDescription(item.useDescription || "Gõ `.roll 10` để thử vận may!");
    return message.reply({ embeds: [embed] });
}

async function handleRoll(message, args) {
    const userId = message.author.id;
    if (!rollWaitList[userId]) return; 
    
    if (!args[0] || args[0] !== '10') {
        return message.reply("Gõ `.roll 10` mới đúng nha!");
    }
    
    delete rollWaitList[userId];  
    const result = Math.floor(Math.random() * 10) + 1;
    let win = 0;
    let msg = "";
    if ([2, 5, 6].includes(result)) { 
        win = 1500; 
        msg = `🎲 Số **${result}** - Trúng **1.500** ${CURRENCY}`; 
    } else if (result === 10) { 
        win = 2500; 
        msg = `🎲 **JACKPOT!** Số **${result}** - Nhận Thêm **2.500** ${CURRENCY}`; 
    } else { 
        msg = `🎲 Số **${result}** - Còn đúng cái nịt!`; 
    }    
    if (win > 0) {
        await economy.addMoney(userId, win, "Lucky Box Win");
    }   
    return message.reply(msg);
}



function chunkArray(myArray, chunk_size){
    let index = 0;
    let arrayLength = myArray.length;
    let tempArray = [];
    
    for (index = 0; index < arrayLength; index += chunk_size) {
        myChunk = myArray.slice(index, index+chunk_size);
        tempArray.push(myChunk);
    }
    return tempArray;
}

function formatGemGrid(gems) {
    if (!gems || gems.length === 0) return "";
    const GRID_WIDTH = 10; 
    const rows = chunkArray(gems, GRID_WIDTH);
    return rows.map(row => '| ' + row.map(g => g.emoji).join(' | ') + ' |').join('\n');
}

function calculateRewards(amount, rates, fallbackGemId) {
    const results = [];
    const activeRates = [...rates]; 

    for (let i = 0; i < amount; i++) {
        const rand = Math.random() * 100;
        let accumulatedRate = 0;
        let selectedGem = null;
        
        for (const gem of activeRates) {
            accumulatedRate += gem.rate;
            if (rand <= accumulatedRate) { 
                selectedGem = SHOP_ITEMS[gem.id]; 
                break; 
            }
        }
        if (!selectedGem) selectedGem = SHOP_ITEMS[fallbackGemId];
        results.push(selectedGem);
    }
    return results;
}


async function openLootbox(message, userId, item, amount) {
    const boxName = item.name;
    const boxIcon = item.emoji;  
    
    
    let rates;
    let fallbackGemId;
    if (item.id === 'lootboxvip') { rates = GEM_RATES_VIP; fallbackGemId = 'gem1'; } 
    else if (item.id === 'crate') { rates = GEM_RATES_CRATE; fallbackGemId = 'gem1a'; } 
    else if (item.id === 'crateL') { rates = GEM_RATES_CRATE_L; fallbackGemId = 'gem1a'; } 
    else { rates = GEM_RATES; fallbackGemId = 'gem1'; }  

    
    const allRewards = calculateRewards(amount, rates, fallbackGemId);

    
    openingSessions.set(userId, { amount: amount, emoji: boxIcon });
    
    let OPEN_ICON = '<a:lootboxopen:1461108774160039998>'; 
    if (item.id === 'lootboxvip') OPEN_ICON = '<a:lootboxvipopen:1463839758831849618>';
    else if (item.id === 'crate') OPEN_ICON = '<a:crateopen:1461620332510052446>';
    else if (item.id === 'crateL') OPEN_ICON = '<a:crateLpopen:1463843469415026784>';

    
    const embed = new EmbedBuilder()
        .setColor('Gold') 
        .setTitle('**Tiến Hành Mở Hòm**')
        .setDescription(
            `------------------------------------------------\n` +
            `<@${userId}> đã tiến hành mở **${amount}** ${boxIcon} **${boxName}**\n\n` +
            `Đang chuẩn bị...`
        );
    
    
    let msg;
    try {
        msg = await message.reply({ embeds: [embed] });
    } catch (err) {
        console.error("Không gửi được tin nhắn mở hòm:", err);
        openingSessions.delete(userId);
        return; 
    }

    
    
    try {
        const rewardSummary = {};
        
        
        for (const gem of allRewards) {
            rewardSummary[gem.id] = (rewardSummary[gem.id] || 0) + 1;
        }

        
        const dbPromises = Object.entries(rewardSummary).map(async ([gemId, count]) => {
            
            await economy.addItem(userId, gemId, count);
            
            
            if (item.id === 'lootboxvip' && ['gem6', 'gem7'].includes(gemId)) {
                await updateMissionProgress(userId, 'open_gem_vip', count);
            }
            
            if (item.id === 'crateL' && ['gem6a', 'gem7a'].includes(gemId)) {
                await updateMissionProgress(userId, 'open_crate_legend', count);
            }

            
            
            
            for(let k=0; k<count; k++) {
                 economy.logGemHistory(userId, gemId, SHOP_ITEMS[gemId].name).catch(console.error);
            }
        });

        await Promise.all(dbPromises); 

    } catch (e) {
        console.error("Lỗi cập nhật DB:", e);
        msg.edit({ content: "⚠️ Có lỗi khi lưu vật phẩm, vui lòng báo admin!" });
        openingSessions.delete(userId);
        return;
    }

    
    try {
        const BATCH_SIZE = 5; 
        const batches = chunkArray(allRewards, BATCH_SIZE);
        let accumulatedGems = [];
        
        
        for (let i = 0; i < batches.length; i++) {
            const currentBatch = batches[i];
            const currentCount = currentBatch.length;
            const isFirstBatch = (i === 0);
            
            const remainingCount = amount - (accumulatedGems.length + currentCount);

            
            const openingIconsStr = '| ' + Array(currentCount).fill(OPEN_ICON).join(' | ') + ' |';
            const receivedStr = accumulatedGems.length > 0 ? formatGemGrid(accumulatedGems) : "";
            
            let descPhase1 = 
                `------------------------------------------------\n` +
                `<@${userId}> đã tiến hành mở **${amount}** ${boxIcon} **${boxName}**\n\n`;
            
            if (receivedStr) {
                descPhase1 += `**Nhận được**\n${receivedStr}\n\n`;
            }

            const batchLabel = isFirstBatch ? "đầu tiên" : "tiếp theo";
            descPhase1 += `Đang mở **${currentCount}** ${boxIcon} ${batchLabel}:\n${openingIconsStr}\n\n` +
                          `Còn lại **${remainingCount}** ${boxIcon}`;

            await msg.edit({ embeds: [EmbedBuilder.from(embed).setDescription(descPhase1)] });

            
            await new Promise(r => setTimeout(r, currentCount * 1000));

            
            accumulatedGems = accumulatedGems.concat(currentBatch);
            
            const updatedReceivedStr = formatGemGrid(accumulatedGems);
            
            let descPhase2 = 
                `------------------------------------------------\n` +
                `<@${userId}> đã tiến hành mở **${amount}** ${boxIcon} **${boxName}**\n\n` +
                `**Nhận được**\n${updatedReceivedStr}\n\n` +
                `Còn lại **${remainingCount}** ${boxIcon}`; 

            await msg.edit({ embeds: [EmbedBuilder.from(embed).setDescription(descPhase2)] });

            
            if (remainingCount > 0) {
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        let totalMaxValue = 0;
            allRewards.forEach(gem => {
                const maxPrice = GEM_PRICE_RANGES[gem.id] ? GEM_PRICE_RANGES[gem.id].max : 0;
                totalMaxValue += maxPrice;
            });
        
        const finalGrid = formatGemGrid(accumulatedGems);
        const finalDescription = 
            `------------------------------------------------\n` +
            `<@${userId}> đã tiến hành mở **${amount}** ${boxIcon} **${boxName}**\n\n` +
            `**Nhận được**\n` +
            `${finalGrid}`;

        const finalEmbed = new EmbedBuilder()
            .setColor('Gold')
            .setTitle('**Mở Hòm Hoàn Tất**')
            .setDescription(finalDescription)
            .setFooter({ 
                    text: `Tổng giá trị ngọc khi giá tối đa: ${totalMaxValue.toLocaleString('vi-VN')} ${CURRENCY}` 
                });
        await msg.edit({ embeds: [finalEmbed] });

    } catch (e) {
        console.error("[Lootbox] Error during animation:", e);
        message.channel.send(`⚠️ Có lỗi hiển thị, nhưng vật phẩm đã được cộng đủ vào kho của <@${userId}>.`);
    } finally {
        openingSessions.delete(userId);
    }
}

module.exports = { activateLuckyBox, handleRoll, openLootbox, getOpeningSession };
