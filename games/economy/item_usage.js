const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const { SHOP_ITEMS, HUNT_CONFIG } = require('../../config');
const economy = require('../../utils/economy');
const { activateChickenBox } = require('../casino/chicken');
const { activateLuckyBox, openLootbox, getOpeningSession } = require('../economy/lootbox');
const { findAllItemsSmart } = require('../../utils/helpers'); 
const { showSelectionMenu } = require('../../utils/selection_ui'); 
const { updateMissionProgress } = require('../mission'); 

async function handleUseItem(message, args) {
    const userId = message.author.id;

    let quantity = 1;
    let keywordArgs = args;
    const lastArg = args[args.length - 1];

    if (lastArg && lastArg.toLowerCase() === 'all') {
        quantity = 'all'; 
        keywordArgs = args.slice(0, -1);
    } else if (lastArg && !isNaN(parseInt(lastArg))) {
        quantity = parseInt(lastArg);
        keywordArgs = args.slice(0, -1);
    }

    const searchKeyword = keywordArgs.join(' ');
    
    
    const matchedItems = findAllItemsSmart(searchKeyword);

    if (matchedItems.length === 0) {
        return message.reply("Không tìm thấy vật phẩm nào tên như vậy.");
    }

    
    if (matchedItems.length > 1) {
        const selectionItems = matchedItems.map(i => ({
            id: i.id,
            name: i.name,
            emoji: i.emoji || '📦',
            type: 'item',
            data: i
        }));

        return showSelectionMenu(message, selectionItems, 'use', (selected) => {
            processUseItem(message, selected.data, quantity, userId);
        });
    }

    
    processUseItem(message, matchedItems[0], quantity, userId);
}


async function processUseItem(message, item, quantity, userId) {
    
    
    const buffInfo = HUNT_CONFIG.GEM_BUFFS[item.id];
    if (buffInfo) {
        const userStock = await economy.getItemAmount(userId, item.id);
        if (userStock <= 0) return message.reply(`Bạn không có **${item.name}** nào.`);

        const currentBuffs = await economy.getUserBuffs(userId);
        if (buffInfo.type === 'quantity' && currentBuffs.qty_turns > 0) {
            return message.reply(`⛔ Bạn đang có hiệu ứng **Tăng Số Lượng**. Hãy dùng hết lượt trước!`);
        }
        if (buffInfo.type === 'quality' && currentBuffs.qual_turns > 0) {
            return message.reply(`⛔ Bạn đang có hiệu ứng **Tăng Tỉ Lệ**. Hãy dùng hết lượt trước!`);
        }

        let desc = buffInfo.type === 'quantity' 
            ? `${item.emoji} sẽ giúp **tăng thêm ${buffInfo.bonus} thú** bắt được với **${buffInfo.turns} lượt hunt**`
            : `${item.emoji} sẽ giúp **tăng đáng kể cơ hội bắt thú hiếm** với **${buffInfo.turns} lượt hunt**`;

        const embed = new EmbedBuilder()
            .setColor('Blue')
            .setTitle('Xác nhận sử dụng vật phẩm')
            .setDescription(`Bạn có chắc muốn sử dụng ${item.emoji} **${item.name}** để đi bắt thú không?\n\n${desc}`);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('buff_yes').setLabel('Có').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('buff_no').setLabel('Không').setStyle(ButtonStyle.Danger)
        );

        const replyMsg = await message.reply({ embeds: [embed], components: [row] });
        const collector = replyMsg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 30000, filter: i => i.user.id === userId });

        collector.on('collect', async i => {
            if (i.customId === 'buff_no') await i.update({ content: "Đã hủy sử dụng.", embeds: [], components: [] });
            else {
                const stockNow = await economy.getItemAmount(userId, item.id);
                if (stockNow <= 0) return i.update({ content: "Bạn đã hết item này rồi.", embeds: [], components: [] });
                
                await economy.removeItem(userId, item.id, 1);
                await economy.activateBuff(userId, buffInfo.type, item.id, buffInfo.turns);
                
                
                await updateMissionProgress(userId, 'hunt_buff', 1);
                await updateMissionProgress(userId, 'use_item', 1);

                await i.update({ content: `Đã kích hoạt sức mạnh của ${item.emoji} **${item.name}**!`, embeds: [], components: [] });
            }
        });
        return;
    }

    
    if (['lootbox', 'lootboxvip', 'crate', 'crateL'].includes(item.id)) {
        
        
        const activeSession = getOpeningSession(userId);
        if (activeSession) {
            return message.channel.send(`<@${userId}> Bạn đang mở **${activeSession.amount}** ${activeSession.emoji} phía trên. Vui lòng chờ hòm mở xong!!!`);
        }

        const userStock = await economy.getItemAmount(userId, item.id);
        if (userStock <= 0) return message.reply(`Bạn không có **${item.name}** nào để mở.`);

        const MAX_OPEN = 100;
        let amountToOpen = quantity === 'all' ? Math.min(userStock, MAX_OPEN) : Math.min(quantity, userStock);
        if (amountToOpen > MAX_OPEN) amountToOpen = MAX_OPEN;
        
        await economy.removeItem(userId, item.id, amountToOpen);
        
        if ((quantity === 'all' && userStock > MAX_OPEN) || (quantity > MAX_OPEN)) {
            message.channel.send(`Chỉ được mở tối đa **${MAX_OPEN}** hòm một lúc. Đang mở **${amountToOpen}** hòm.`);
        }
        
        
        if (item.id === 'lootbox') {
            await updateMissionProgress(userId, 'open_lootbox', amountToOpen);
        } else if (item.id === 'lootboxvip') {
            await updateMissionProgress(userId, 'open_vip', amountToOpen);
        }

        await openLootbox(message, userId, item, amountToOpen);
        return;
    }

    
    const hasItem = await economy.removeItem(userId, item.id, 1);
    if (!hasItem) return message.reply("Không có hàng trong kho.");

    if (item.id === 'luckybox') {
        await activateLuckyBox(message, userId, item);
        
        
        await updateMissionProgress(userId, 'use_item', 1);

    } else if (item.id === 'chickenbox') {
        const result = await activateChickenBox(message, userId);
        if (!result.success) {
            await economy.addItem(userId, item.id, 1); 
            message.reply(result.msg);
        } else {
            
            await updateMissionProgress(userId, 'use_item', 1);
        }
    } else {
         message.reply({ embeds: [new EmbedBuilder().setColor('Purple').setTitle(`📦 ĐÃ SỬ DỤNG ${item.name.toUpperCase()}`).setDescription("Đã sử dụng vật phẩm.")] });
    }
}

module.exports = { handleUseItem };
