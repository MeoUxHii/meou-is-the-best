const { EmbedBuilder } = require('discord.js');
const { GAME_CONFIG, CURRENCY } = require('../../config');
const economy = require('../../utils/economy');
const { parseBetAmount } = require('../../utils/helpers');
const { updateMissionProgress } = require('../mission'); // <--- IMPORT MISSION

const chickenSessions = {}; 
const cockFightStats = {}; 

async function handleChicken(message, args) {
    const userId = message.author.id;
    const guildId = message.guild.id;

    if (!args[0] && chickenSessions[userId]) {
        const session = chickenSessions[userId];
        
        if (Date.now() - session.startTime > 120000) {
            clearInterval(session.timer);
            delete chickenSessions[userId];
            return message.reply("Gà chết già rồi. Mua con khác đê!");
        }

        const isWin = Math.random() < GAME_CONFIG.winRateChickenBox;
        
        if (isWin) {
            session.wins++;
            let reward = 0;
            if (session.wins === 1) reward = 2000;
            if (session.wins === 2) reward = 1500;
            if (session.wins === 3) reward = 2500;

            await economy.addMoney(userId, reward, "Chicken Fight Win");
            message.reply(`<:ga:1458577141804306643> của bạn đá thắng và mang về cho bạn **${reward.toLocaleString('vi-VN')}** ${CURRENCY}`);

            await updateMissionProgress(userId, 'chicken_win', 1); 
            await updateMissionProgress(userId, 'chicken_streak', 1);
            await updateMissionProgress(userId, 'chickenbox_win', 1);
            await updateMissionProgress(userId, 'casino_win_total', reward); 
            await updateMissionProgress(userId, 'casino_profit', reward);

            if (session.wins >= 3) {
                clearInterval(session.timer);
                delete chickenSessions[userId];
                message.reply(`**Gà Điên Xuất Hiện!** Gà của <@${userId}> đã thắng thông 3 trận liên tiếp và mang về **6000** ${CURRENCY} Gà sẽ được thu hồi để tiêu hủy`);
            }
        } else {
            clearInterval(session.timer);
            delete chickenSessions[userId];
            
            await updateMissionProgress(userId, 'chicken_streak', 0, true);
            
            message.reply(`🪦 **Gà của bạn đã tử trận!** Trò chơi kết thúc.`);
        }
        return;
    }

    let betAmount = 0;
    let balance = null;

    if (args[0] && args[0].toLowerCase() === 'all') {
        balance = await economy.getBalance(userId); 
        betAmount = balance.cash > GAME_CONFIG.maxBetDaGa ? GAME_CONFIG.maxBetDaGa : balance.cash;
    } else {
        betAmount = parseBetAmount(args[0]);
    }

    if (!args[0]) return message.reply("Nhập tiền vào bạn ơi! VD: `.dg 500` hoặc `.dg all`");
    if (betAmount <= 0) return message.reply("Tiền cược tào lao!");
    if (betAmount > GAME_CONFIG.maxBetDaGa) return message.reply(`Cược tối đa **${GAME_CONFIG.maxBetDaGa.toLocaleString('vi-VN')}** thôi!`);

    if (!balance) balance = await economy.getBalance(userId); 
    if (balance.cash < betAmount) return message.reply(`Không đủ tiền! Bạn chỉ có ${balance.cash.toLocaleString('vi-VN')} ${CURRENCY}`);
    
    const success = await economy.subtractMoney(userId, betAmount, "Bet Chicken Fight");
    if (!success) return message.reply("Lỗi trừ tiền.");

    await updateMissionProgress(userId, 'bet_total', betAmount);
    if (betAmount >= 20000) {
        await updateMissionProgress(userId, 'bet_big', 1);
    }

    if (!cockFightStats[userId]) cockFightStats[userId] = 0; 
    let winRate = GAME_CONFIG.winRateDaGaBase + (cockFightStats[userId] * 0.01); 
    if (winRate > GAME_CONFIG.winRateDaGaMax) winRate = GAME_CONFIG.winRateDaGaMax;
    
    const isWin = Math.random() < winRate;
    const embed = new EmbedBuilder().setAuthor({ name: "MeoU Miền Tây - Đá Gà", iconURL: message.author.displayAvatarURL() });

    if (isWin) {
        cockFightStats[userId]++;
        const winAmount = betAmount * 2; 
        
        await economy.addMoney(userId, winAmount, "Win Chicken Fight");
        
        await updateMissionProgress(userId, 'chicken_win', 1);
        await updateMissionProgress(userId, 'chicken_streak', 1);
        await updateMissionProgress(userId, 'casino_win_total', winAmount);
        
        const profit = winAmount - betAmount;
        if (profit > 0) await updateMissionProgress(userId, 'casino_profit', profit);

        if (betAmount >= GAME_CONFIG.maxBetDaGa) {
            await updateMissionProgress(userId, 'chicken_max_bet', 1);
        }

        embed.setColor('Green').setDescription(`Gà của bạn đã thắng và mang về cho bạn **${winAmount.toLocaleString('vi-VN')}** ${CURRENCY}!\nChuỗi **${cockFightStats[userId]}** trận thắng <:ga:1458577141804306643>`).setFooter({ text: `Sức mạnh: ${Math.round(winRate*100)}%` });
    } else {
        cockFightStats[userId] = 0; 
        
        await updateMissionProgress(userId, 'chicken_streak', 0, true);

        embed.setColor('Red').setDescription(`🪦 Gà của bạn đã về nơi chín suối!\nChuỗi win reset về 0.`).setFooter({ text: `Sức mạnh: ${Math.round(winRate*100)}%` });
    }
    return message.reply({ embeds: [embed] });
}

async function activateChickenBox(message, userId) {
    if (chickenSessions[userId]) {
        return { success: false, msg: "🚫 Đang có gà rồi, đá xong đi đã." };
    }
    const getDesc = (t) => `**Luật:** Trong **${t}s** hãy đá 3 trận đá gà.\n👊 Gõ \`.dg\` để đá.\n------------------------\n•Thắng 1 Lần: Nhận 2000🪙\n•Thắng 2 Lần: Thêm 1500🪙\n•Thắng 3 Lần: Thêm 2500🪙`;
    const embed = new EmbedBuilder().setColor('DarkRed').setTitle("🐓 GÀ CHIẾN VÀO CHUỒNG!").setDescription(getDesc(120));
    const msg = await message.reply({ embeds: [embed] });
    
    let t = 120;
    const timer = setInterval(async () => { 
        t--; 
        if (t <= 0) { 
            clearInterval(timer); 
            delete chickenSessions[userId]; 
            msg.edit({ embeds: [EmbedBuilder.from(embed).setDescription("**HẾT GIỜ!**")] }); 
            return; 
        } 
        try { if(t % 5 === 0) msg.edit({ embeds: [EmbedBuilder.from(embed).setDescription(getDesc(t))] }); } catch (e) {} 
    }, 1000);
    
    chickenSessions[userId] = { wins: 0, startTime: Date.now(), timer: timer };
    return { success: true };
}

module.exports = { handleChicken, activateChickenBox };