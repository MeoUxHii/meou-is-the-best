require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
const { SHOP_ITEMS } = require('./config');
const economy = require('./utils/economy');
const gemMarket = require('./utils/gem_market'); 
const startDashboard = require('./dashboard/server');
const { checkChannel, sendLootboxMessage, findAllItemsSmart } = require('./utils/helpers'); 
const { handleWordChain, loadDictionary, resumeWordChainGames } = require('./games/social/wordchain');
const { handleUnoInteraction } = require('./games/cards/uno_game');
const { initShopData } = require('./games/economy/shop');
const { loadGlobalConfig } = require('./utils/configLoader'); 
const { handleLevelSystem, addXpBackdoor } = require('./games/level');
const { handleMissionCommand, updateMissionProgress } = require('./games/mission'); 

const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim());

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers 
    ]
});


const chatCooldowns = new Map();
const dropTracking = new Map();

client.commands = new Collection();
client.aliases = new Collection(); 

const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (fs.statSync(folderPath).isDirectory()) {
        const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);
            if ('name' in command && 'execute' in command) {
                client.commands.set(command.name, command);
                if (command.aliases && Array.isArray(command.aliases)) {
                    command.aliases.forEach(alias => {
                        client.aliases.set(alias, command.name);
                    });
                }
                console.log(`[CMD] Loaded: ${command.name}`);
            }
        }
    }
}

client.once(Events.ClientReady, async () => {
    console.log(`Bot ${client.user.tag} đã trực tuyến`);
    await economy.init();
    await loadGlobalConfig()
    await initShopData();
    await loadDictionary();
    gemMarket.startMarketScheduler();
    await resumeWordChainGames(client);
    economy.startBackgroundSync(client); 
    console.log("🚀 Tất cả hệ thống đã sẵn sàng!");
});

client.on('userUpdate', (oldUser, newUser) => {
    economy.updateUserDiscordInfo(newUser.id, newUser);
});
startDashboard(client);

client.login(process.env.DISCORD_TOKEN);

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || !message.guild) return;

    economy.updateUserDiscordInfo(message.author.id, message.author);

    const config = await economy.getConfig(message.guild.id);
    const prefix = config.prefix || '.';
    const userId = message.author.id;
    handleLevelSystem(message).catch(err => console.error("Level Error:", err));
    
    const contentLower = message.content.toLowerCase().trim();
    if (contentLower !== 'meoutest' && contentLower !== 'meoutestvip') {
        const now = Date.now();
        let tracker = dropTracking.get(userId);
     
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
        const nextHourTimestamp = nextHour.getTime();

        const nextDay = new Date();
        nextDay.setHours(24, 0, 0, 0); // Reset vào 0h ngày hôm sau
        const nextDayTimestamp = nextDay.getTime();
   
        // Khởi tạo hoặc cập nhật bộ đếm Tracker
        if (!tracker) {
            tracker = { 
                count: 0, 
                resetTime: nextHourTimestamp, 
                dailyCount: 0,
                dailyResetTime: nextDayTimestamp,
                lastDropTime: 0            
            };
            dropTracking.set(userId, tracker);
        } else {
            // Reset giờ nếu đã qua giờ mới
            if (now > tracker.resetTime) {
                tracker.count = 0;
                tracker.resetTime = nextHourTimestamp;
            }
            // Reset ngày nếu đã qua ngày mới
            if (now > tracker.dailyResetTime) {
                tracker.dailyCount = 0;
                tracker.dailyResetTime = nextDayTimestamp;
            }
        }
        
        // Cập nhật Logic: Tối đa 5 hòm/giờ và 20 hòm/ngày, delay 60s
        if (tracker.count < 5 && tracker.dailyCount < 20 && (now - tracker.lastDropTime >= 60000)) {
            const chance = Math.random();
            let droppedItem = null;
            
            // 1% Hòm VIP, 5% Hòm thường
            if (chance < 0.01) { droppedItem = 'lootboxvip'; }      
            else if (chance < 0.06) { droppedItem = 'lootbox'; } // Từ 0.01 đến 0.06 là 5%

            if (droppedItem) {
                tracker.count++;
                tracker.dailyCount++; // Tăng thêm bộ đếm ngày
                tracker.lastDropTime = now;
                
                await economy.addItem(userId, droppedItem, 1);
                // Truyền tracker hiện tại (chỉ in count/giờ ra) để user không biết dailyCount
                sendLootboxMessage(message.channel, message.member || message.author, droppedItem, tracker);
            }
        }
    }
    
    
    if (!message.content.startsWith(prefix)) {
        
        let testItem = null;
        if (contentLower === 'meoutest') testItem = 'lootbox';
        if (contentLower === 'meoutestvip') testItem = 'lootboxvip';
        
        if (testItem) {
            if (!ADMIN_IDS.includes(userId)) return;

            await economy.addItem(userId, testItem, 1);
            const nextHour = new Date();
            nextHour.setHours(nextHour.getHours() + 1);
            nextHour.setMinutes(0, 0, 0);
            const fakeTracker = { count: 1, resetTime: nextHour.getTime() };
            sendLootboxMessage(message.channel, message.member || message.author, testItem, fakeTracker);
            return; 
        }
        if (contentLower === 'meoulvt') {
            if (!ADMIN_IDS.includes(userId)) return;
            
            await addXpBackdoor(message, 100);
            message.reply("Đã buff bẩn **100 XP** để test!");
            return;
        }

        
        if (await checkChannel(message, 'noitu')) {
             await handleWordChain(message, null, null);
        }

        
        const chatMissions = {
            'chat_meo': "Meo Meo",
            'chat_gau': "Gâu Gâu",
            'chat_hdpe': "HDPE thì ngon luôn",
            'chat_do': "Anh Độ My Suy"
        };

        const contentTrimmed = message.content.trim();
        for (const [type, phrase] of Object.entries(chatMissions)) {
            if (contentTrimmed.toLowerCase() === phrase.toLowerCase()) {
                const nowChat = Date.now();
                const lastChatTime = chatCooldowns.get(userId) || 0;
                
                
                if (nowChat - lastChatTime >= 3000) {
                    await updateMissionProgress(userId, type, 1);
                    chatCooldowns.set(userId, nowChat);
                    
                }
                break; 
            }
        }
        

        return; 
    }

    
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    const commandConfigName = client.aliases.get(cmdName) || cmdName;
    const command = client.commands.get(commandConfigName);
    
    if (!command) return;
    
    try {
        const isDisabled = await economy.isCommandDisabled(message.channel.id, cmdName, {}); 
        if (isDisabled) return;
        if (command.gameType) {
            if (!(await checkChannel(message, command.gameType))) return;
        }
        await command.execute(message, cmdName, args, client);
    } catch (error) {
        console.error(`Lỗi xử lý lệnh ${cmdName}:`, error);
        message.reply("Có lỗi xảy ra khi thực hiện lệnh này!");
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isButton()) {
        const customId = interaction.customId;
        if (customId.startsWith('uno_')) {
            await handleUnoInteraction(interaction);
        }
    }
});

process.on('unhandledRejection', (reason, promise) => {
    if (reason && reason.code === 429) return;
    if (reason && reason.name === 'GatewayRateLimitError') return;
    console.error('❌ Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
});
