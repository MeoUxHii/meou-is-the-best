const { handleShop, handleCheckPrice, handleItemInfo, handleSellGem } = require('../../games/economy/shop');
const { handleInventory, handleGiveItem, handleAddItem, handleRemoveItem } = require('../../games/economy/inventory');
const { handleUseItem } = require('../../games/economy/item_usage');
const { executeSellZoo, findAllMatchingAnimals } = require('../../games/rpg/zoo_market');
const { findAllItemsSmart, showSelectionMenu } = require('../../utils/helpers'); 
const { showSelectionMenu: showMenuUI } = require('../../utils/selection_ui');
const { HUNT_CONFIG } = require('../../config');
const { EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder, ComponentType } = require('discord.js');
const economy = require('../../utils/economy');
const gemMarket = require('../../utils/gem_market');

module.exports = {
    name: 'store',
    aliases: [
        'ch', 'mua', 'buy', 'cuahang', 'shop', 'addstock', 'setmoney',
        'check', 'reroll', 'iteminfo', 'bootboxvip', 'lbvip',
        'inv', 'inventory', 'kho', 'give-item', 'giveitem', 'cho-item', 'choitem',
        'additem', 'add-item', 'remove-item',
        'xai', 'use',
        'ban', 'sell' 
    ],
    execute: async (message, cmd, args, client) => {
        const rawCmd = message.content.split(' ')[0].toLowerCase(); 

        if (['ch', 'mua', 'buy', 'cuahang', 'shop', 'addstock', 'setmoney'].includes(cmd)) {
            await handleShop(message, rawCmd.startsWith('.') ? rawCmd : `.${cmd}`, args);
        }
        else if (cmd === 'check') await handleCheckPrice(message);
        else if (cmd === 'iteminfo' || cmd === 'bootboxvip' || cmd === 'lbvip') await handleItemInfo(message, [cmd === 'iteminfo' ? args[0] : cmd]);
        else if (['inv', 'inventory', 'kho'].includes(cmd)) await handleInventory(message, args);
        else if (['give-item', 'giveitem', 'cho-item', 'choitem'].includes(cmd)) await handleGiveItem(message, args);
        else if (['additem', 'add-item'].includes(cmd)) await handleAddItem(message, args); 
        else if (cmd === 'remove-item') await handleRemoveItem(message, args);
        else if (['xai', 'use'].includes(cmd)) await handleUseItem(message, args);
        
        else if (cmd === 'reroll') {
             if (message.author.id === message.guild.ownerId || message.author.id === '414792622289190917') {
                 gemMarket.updateMarketPrices();
                 message.reply(" Đã cập nhật lại giá thị trường đá quý!");
             } else {
                 message.reply("⛔ Bạn không có quyền reroll giá thị trường.");
             }
        }

        
        else if (cmd === 'ban' || cmd === 'sell') {
            if (args.length === 0) return message.reply("Bạn muốn bán gì? VD: `.ban sau` hoặc `.ban sau 10`");

            let quantity = 1;
            let isAll = false;
            let keywordArgs = args;
            const lastArg = args[args.length - 1].toLowerCase();
            
            if (lastArg === 'all') { isAll = true; keywordArgs = args.slice(0, -1); }
            else if (!isNaN(parseInt(lastArg))) { quantity = parseInt(lastArg); keywordArgs = args.slice(0, -1); }

            const searchKeyword = keywordArgs.join(' ');
            const userId = message.author.id; 

            const cleanKeyUpper = searchKeyword.toUpperCase().trim();
            if (HUNT_CONFIG && HUNT_CONFIG.CLASSES && HUNT_CONFIG.CLASSES[cleanKeyUpper]) {
                const classData = HUNT_CONFIG.CLASSES[cleanKeyUpper];
                const targetObj = { type: 'class', id: cleanKeyUpper, ...classData, data: classData };
                return executeSellZoo(message, targetObj, quantity, isAll);
            }

            let potentialAnimals = findAllMatchingAnimals(searchKeyword);
            let potentialItems = findAllItemsSmart(searchKeyword).filter(i => i.id.startsWith('gem')); 
            const userInventory = await economy.getInventory(userId); 
            const userZoo = await economy.getZoo(userId);

            const ownedAnimals = potentialAnimals.filter(a => {
                const count = (userZoo.animals && userZoo.animals[a.id]) ? userZoo.animals[a.id] : 0;
                return count > 0;
            });

            const ownedItems = potentialItems.filter(i => {
                const found = userInventory.find(inv => inv.item_id === i.id);
                return found && found.amount > 0;
            });

            const allMatches = [
                ...ownedAnimals.map(a => ({ ...a, type: 'animal' })),
                ...ownedItems.map(i => ({ ...i, type: 'item' }))
            ];

            if (allMatches.length === 0) {
                if (potentialAnimals.length > 0 || potentialItems.length > 0) {
                    return message.reply(`🔍 Tìm thấy vật phẩm/thú phù hợp nhưng bạn **không sở hữu** cái nào để bán.`);
                }
                return message.reply("Không tìm thấy vật phẩm hay thú nào phù hợp.");
            }

            const processSellSelection = async (selected, interaction) => {
                const ctx = interaction || message;
                if (selected.type === 'animal') {
                    executeSellZoo(ctx, selected, quantity, isAll);
                } 
                else if (selected.type === 'item') {
                    const { handleSellGem } = require('../../games/economy/shop');
                    const newArgs = [selected.id, isAll ? 'all' : quantity.toString()];
                    handleSellGem(message, newArgs); 
                }
            };

            if (allMatches.length > 1) {
                await showMenuUI(message, allMatches, 'sell', processSellSelection);
            } else {
                processSellSelection(allMatches[0], null);
            }
        }
    }
};