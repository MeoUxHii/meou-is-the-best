
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { CURRENCY, HUNT_CONFIG } = require('../../config');
const economy = require('../../utils/economy');
const { removeVietnameseTones } = require('../../utils/helpers');


function resolveZooTarget(keyword) {
    if (!keyword) return null;
    const all = findAllMatchingAnimals(keyword);
    return all.length > 0 ? all[0] : null;
}


function findAllMatchingAnimals(keyword) {
    if (!keyword) return [];
    const cleanKey = removeVietnameseTones(keyword.toLowerCase().trim());
    const matches = [];

    
    for (const [classKey, classData] of Object.entries(HUNT_CONFIG.CLASSES)) {
        if (classKey.toLowerCase() === cleanKey || 
            removeVietnameseTones(classData.name.toLowerCase()) === cleanKey) {
            matches.push({ type: 'class', id: classKey, ...classData, data: classData });
        }
    }

    
    for (const [classKey, animals] of Object.entries(HUNT_CONFIG.ANIMALS)) {
        for (const animal of animals) {
            const cleanName = removeVietnameseTones(animal.name.toLowerCase());
            
            if (animal.id === cleanKey || cleanName === cleanKey || cleanName.includes(cleanKey)) {
                const price = animal.price || HUNT_CONFIG.CLASSES[classKey].price || 0;
                matches.push({ 
                    type: 'animal', 
                    id: animal.id, 
                    name: animal.name, 
                    emoji: animal.emoji, 
                    price: price,
                    data: animal 
                });
            }
        }
    }
    return matches;
}


async function executeSellZoo(context, targetObj, quantityInput, isAll) {
    const isInteraction = !!context.isButton; 
    const userId = isInteraction ? context.user.id : context.author.id;

    
    const zooData = await economy.getZoo(userId);
    

    const sendError = async (msg) => {
        if (isInteraction) return context.update({ content: msg, embeds: [], components: [] });
        return context.reply(msg);
    };

    if (!zooData || !zooData.animals) return sendError("Kho thú trống trơn!");

    let itemsToSell = [];
    let totalMoney = 0;
    let descriptionStr = "";

    
    const getCount = (id) => {
        if (zooData.animals instanceof Map) return zooData.animals.get(id) || 0;
        return zooData.animals[id] || 0;
    };

    
    if (targetObj.type === 'class') {
        const classKey = targetObj.id;
        const animalsInClass = HUNT_CONFIG.ANIMALS[classKey];
        
        if (animalsInClass) {
            for (const animal of animalsInClass) {
                const count = getCount(animal.id); 
                if (count > 0) {
                    const pricePerOne = animal.price || 0;
                    itemsToSell.push({
                        id: animal.id,
                        name: animal.name,
                        emoji: animal.emoji,
                        amount: count,
                        totalPrice: count * pricePerOne
                    });
                    totalMoney += (count * pricePerOne);
                }
            }
        }
        descriptionStr = `Bạn có chắc muốn bán **toàn bộ** thú hạng **${targetObj.name}** ${targetObj.emoji} không?`;
    } 
    
    else if (targetObj.type === 'animal') {
        const currentStock = getCount(targetObj.id); 
        
        if (currentStock <= 0) return sendError(`Bạn không có **${targetObj.name}** ${targetObj.emoji} nào.`);

        let quantity = quantityInput;
        if (isAll || quantity > currentStock) quantity = currentStock;
        if (quantity <= 0) return sendError("Số lượng không hợp lệ.");

        const totalPrice = quantity * targetObj.price;
        itemsToSell.push({
            id: targetObj.id,
            name: targetObj.name,
            emoji: targetObj.emoji,
            amount: quantity,
            totalPrice: totalPrice
        });
        totalMoney += totalPrice;
        descriptionStr = `Bạn có chắc muốn bán **${quantity}x** ${targetObj.emoji} **${targetObj.name}** không?`;
    }

    if (itemsToSell.length === 0) return sendError("Không tìm thấy thú phù hợp trong kho để bán.");

    
    const confirmEmbed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle('XÁC NHẬN GIAO DỊCH')
        .setDescription(`${descriptionStr}\n--------------------------------\nTổng thu về: **${totalMoney.toLocaleString('vi-VN')}** ${CURRENCY}`);

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('sell_zoo_yes').setLabel('Đồng Ý').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('sell_zoo_no').setLabel('Hủy Bỏ').setStyle(ButtonStyle.Danger)
    );

    let replyMsg;
    if (isInteraction) {
        await context.update({ content: null, embeds: [confirmEmbed], components: [row] });
        replyMsg = context.message; 
    } else {
        replyMsg = await context.reply({ embeds: [confirmEmbed], components: [row] });
    }

    const collector = replyMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000, filter: i => i.user.id === userId });

    collector.on('collect', async interaction => {
        if (interaction.customId === 'sell_zoo_no') {
            await interaction.update({ content: "Đã hủy lệnh bán.", embeds: [], components: [] });
            return;
        }
        if (interaction.customId === 'sell_zoo_yes') {
            
            const currentZoo = await economy.getZoo(userId);
            
            
            const getCountNow = (id) => {
                if (currentZoo.animals instanceof Map) return currentZoo.animals.get(id) || 0;
                return currentZoo.animals[id] || 0;
            };

            let realTotalMoney = 0;
            let soldDetails = [];
            let errorFlag = false;

            for (const item of itemsToSell) {
                const stockNow = getCountNow(item.id);
                if (stockNow < item.amount) { errorFlag = true; break; }
                
                
                await economy.removeAnimals(userId, item.id, item.amount);
                realTotalMoney += item.totalPrice;
                soldDetails.push(`${item.emoji} x${item.amount}`);
            }

            if (errorFlag) return interaction.update({ content: "Giao dịch thất bại! Số lượng thú thay đổi.", embeds: [], components: [] });

            
            await economy.addMoney(userId, realTotalMoney, "Sell Zoo Animals");
            let detailStr = soldDetails.join(', ');
            if (soldDetails.length > 5) detailStr = `${soldDetails.slice(0, 5).join(', ')} ... và ${soldDetails.length - 5} loại khác`;

            const successEmbed = new EmbedBuilder().setColor('Green').setTitle('Hóa Kiếp Thành Công').setDescription(`Đã bán: ${detailStr}\nThu về: **${realTotalMoney.toLocaleString('vi-VN')}** ${CURRENCY}`);
            await interaction.update({ embeds: [successEmbed], components: [] });
        }
    });
}


async function handleSellZoo(message, args) { return false; }

module.exports = { handleSellZoo, resolveZooTarget, findAllMatchingAnimals, executeSellZoo };