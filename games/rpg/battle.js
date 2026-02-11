
const { EmbedBuilder } = require('discord.js');
const { BattleProfile, Setting } = require('../../database/models'); 
const economy = require('../../utils/economy');
const { GAME_CONFIG, HUNT_CONFIG } = require('../../config');
const { ANIMAL_STATS, LEVEL_EXP, calculateStats } = require('../../config'); 
const { removeVietnameseTones } = require('../../utils/helpers');
const { saveConfig } = require('../../utils/configLoader');
const { updateMissionProgress } = require('../mission'); 

const OWNER_ID = '414792622289190917';


function getAnimalDisplayInfo(id) {
    for (const classKey in HUNT_CONFIG.ANIMALS) {
        const found = HUNT_CONFIG.ANIMALS[classKey].find(a => a.id === id);
        if (found) return found;
    }
    return { name: id, emoji: '🐾' };
}


function resolveAnimalId(keyword) {
    const cleanKey = removeVietnameseTones(keyword.toLowerCase());
    for (const id in ANIMAL_STATS) {
        const info = getAnimalDisplayInfo(id);
        const nameClean = removeVietnameseTones(info.name.toLowerCase());
        if (id === cleanKey || nameClean === cleanKey || nameClean.includes(cleanKey)) {
            return id;
        }
    }
    return null;
}


async function handleTeam(message, args) {
    const userId = message.author.id;
    const subCmd = args[0] ? args[0].toLowerCase() : 'view';

    
    let battleProfile = await BattleProfile.findOne({ user_id: userId });
    if (!battleProfile) {
        battleProfile = await BattleProfile.create({ user_id: userId, team: [] });
    }

    
    if (subCmd === 'view' || subCmd === 'check') {
        if (battleProfile.team.length === 0) {
            return message.reply("🛡️ Team của bạn đang trống! Dùng `.team add <tên thú>` để thêm thú vào đội hình.");
        }

        let desc = "";
        let maxLevel = 0;

        battleProfile.team.forEach((pet, index) => {
            const display = getAnimalDisplayInfo(pet.id);
            const stats = calculateStats(pet.id, pet.level);
            
            const nextLevelExp = LEVEL_EXP[pet.level + 1] || "MAX";
            const expStr = nextLevelExp === "MAX" ? "MAX" : `${pet.exp}/${nextLevelExp}`;

            if (pet.level > maxLevel) maxLevel = pet.level;

            desc += `**${index + 1}. ${display.emoji} ${pet.name}** (Lv.${pet.level})\n`;
            desc += `❤️ HP: ${stats.hp} | 🛡️ Armor: ${stats.armor} | ⚔️ Atk: ${stats.atk}\n`;
            desc += `✨ EXP: \`${expStr}\`\n\n`;
        });

        
        if (battleProfile.team.length === 3) await updateMissionProgress(userId, 'team_full', 1);
        if (maxLevel >= 5) await updateMissionProgress(userId, 'team_lv5', 1);
        if (maxLevel >= 10) await updateMissionProgress(userId, 'pet_lv10', 1);

        const embed = new EmbedBuilder()
            .setTitle(`🛡️ Đội Hình Của ${message.author.username}`)
            .setDescription(desc)
            .setColor('Blue')
            .setFooter({ text: "Sử dụng .team remove <tên> để loại bỏ thú" });
        return message.channel.send({ embeds: [embed] });
    }

    
    if (subCmd === 'add') {
        if (battleProfile.team.length >= 3) return message.reply("⛔ Đội hình đã đầy (Tối đa 3 thú)!");
        
        const animalName = args.slice(1).join(' ');
        if (!animalName) return message.reply("Vui lòng nhập tên thú cần thêm. VD: `.team add ga`");

        const animalId = resolveAnimalId(animalName);
        if (!animalId) return message.reply("Không tìm thấy loại thú này trong dữ liệu chiến đấu.");

        
        const zoo = await economy.getZoo(userId);
        const stock = zoo.animals[animalId] || 0;
        
        if (stock <= 0) return message.reply(`🎒 Bạn không có con **${getAnimalDisplayInfo(animalId).name}** nào trong kho.`);

        
        await economy.removeAnimals(userId, animalId, 1);
        
        const displayInfo = getAnimalDisplayInfo(animalId);
        battleProfile.team.push({
            id: animalId,
            name: displayInfo.name,
            origin_name: displayInfo.name,
            level: 0,
            exp: 0
        });
        await battleProfile.save();

        
        if (battleProfile.team.length === 3) {
            await updateMissionProgress(userId, 'team_full', 1);
        }

        return message.reply(`Đã triệu hồi **${displayInfo.emoji} ${displayInfo.name}** vào đội hình chiến đấu!`);
    }

    
    if (subCmd === 'remove') {
        const targetName = args.slice(1).join(' ').toLowerCase();
        if (!targetName) return message.reply("Nhập tên thú cần loại bỏ. VD: `.team remove ga`");

        const index = battleProfile.team.findIndex(p => 
            p.name.toLowerCase().includes(targetName) || p.origin_name.toLowerCase().includes(targetName)
        );

        if (index === -1) return message.reply("Không tìm thấy thú này trong đội hình.");

        const petToRemove = battleProfile.team[index];
        
        
        await economy.addAnimals(userId, [{ id: petToRemove.id }]);
        battleProfile.team.splice(index, 1);
        await battleProfile.save();

        return message.reply(`♻️ Đã đưa **${petToRemove.name}** về lại kho thú (Reset tên về **${petToRemove.origin_name}**).`);
    }
}


async function handleRename(message, args) {
    if (args.length < 2) return message.reply("Cú pháp: `.rename <tên thú hiện tại> <tên mới>`");

    const userId = message.author.id;
    
    let battleProfile = await BattleProfile.findOne({ user_id: userId });
    if (!battleProfile || battleProfile.team.length === 0) return message.reply("Bạn chưa có thú nào trong team!");

    const targetKey = args[0].toLowerCase();
    const newName = args.slice(1).join(' ');

    const pet = battleProfile.team.find(p => 
        p.name.toLowerCase().includes(targetKey) || 
        p.origin_name.toLowerCase().includes(targetKey) ||
        p.id === resolveAnimalId(targetKey)
    );

    if (!pet) return message.reply("Không tìm thấy thú này trong team.");
    if (newName.length > 20) return message.reply("Tên quá dài (Tối đa 20 ký tự).");

    const oldName = pet.name;
    pet.name = newName;
    await battleProfile.save();

    return message.reply(`✏️ Đã đổi tên **${oldName}** thành **${newName}**!`);
}


async function handleBattle(message) {
    const userId = message.author.id;

    
    let userProfile = await BattleProfile.findOne({ user_id: userId });
    if (!userProfile) {
        userProfile = await BattleProfile.create({ user_id: userId, team: [] });
    }
    
    if (userProfile.team.length === 0) {
        return message.reply("🚫 Bạn chưa có thú trong đội hình! Dùng `.team add` để thiết lập.");
    }

    
    const cdSeconds = (GAME_CONFIG.battle && GAME_CONFIG.battle.cooldown) ? GAME_CONFIG.battle.cooldown : 10;
    const lastBattle = userProfile.last_battle ? userProfile.last_battle.getTime() : 0;
    const now = Date.now();
    const diff = (now - lastBattle) / 1000;

    if (diff < cdSeconds) {
        let wait = Math.ceil(cdSeconds - diff);
        const cooldownMsg = await message.reply(`Tổ đội đang hồi sức. Thử lại sau **${wait}s**`);
        const timer = setInterval(async () => {
            wait--;
            if (wait <= 0) {
                clearInterval(timer); 
                cooldownMsg.delete().catch(() => {}); 
            } else {
                try {
                    await cooldownMsg.edit(`Tổ đội đang hồi sức. Thử lại sau **${wait}s**`);
                } catch (e) {
                    clearInterval(timer);
                }
            }
        }, 1000);
        return; 
    }

    
    const totalLevel = userProfile.team.reduce((sum, p) => sum + p.level, 0);
    
    let winRange = [0, 0];
    let configExp = 30;

    const bConf = GAME_CONFIG.battle || {
        tier1: { min: 1000, max: 2000, exp: 50 },
        tier2: { min: 2000, max: 4000, exp: 100 },
        tier3: { min: 4000, max: 6000, exp: 150 }
    };

    if (totalLevel < 30) {
        winRange = [bConf.tier1.min, bConf.tier1.max];
        configExp = bConf.tier1.exp;
    } else if (totalLevel <= 50) {
        winRange = [bConf.tier2.min, bConf.tier2.max];
        configExp = bConf.tier2.exp;
    } else { 
        winRange = [bConf.tier3.min, bConf.tier3.max];
        configExp = bConf.tier3.exp;
    }

    
    let hardRate = 0.57;
    if (totalLevel >= 30 && totalLevel <= 50) hardRate = 0.62;
    if (totalLevel > 50) hardRate = 0.65;

    let isHard = false;
    if (userProfile.win_streak > 0 && userProfile.win_streak % 5 === 0) {
        const streakLuck = Math.random(); 
        if (streakLuck <= 0.46) {
            isHard = Math.random() < hardRate;
        } else {
            isHard = true; 
        }
    } else {
        isHard = Math.random() < hardRate;
    }

    
    const avgLevel = Math.floor(totalLevel / userProfile.team.length);
    const enemyTeamSize = 3;
    const enemyTeam = [];
    const allAnimalIds = Object.keys(ANIMAL_STATS);
    const validEnemyAnimals = allAnimalIds.filter(id => ANIMAL_STATS[id].class !== 'C');
    const poolToPick = validEnemyAnimals.length > 0 ? validEnemyAnimals : allAnimalIds;

    for (let i = 0; i < enemyTeamSize; i++) {
        const randId = poolToPick[Math.floor(Math.random() * poolToPick.length)];
        const info = getAnimalDisplayInfo(randId);
        
        let botLvl;
        if (isHard) {
            botLvl = avgLevel + Math.floor(Math.random() * 4) + 3; 
        } else {
            botLvl = Math.max(0, avgLevel - Math.floor(Math.random() * 4));
        }
        
        const stats = calculateStats(randId, botLvl);
        enemyTeam.push({
            id: randId,
            name: `Wild ${info.name}`,
            emoji: info.emoji,
            level: botLvl,
            hp: stats.hp,
            max_hp: stats.max_hp,
            armor: stats.armor, 
            max_armor: stats.armor, 
            atk: stats.atk
        });
    }

    
    const userTeamBattle = userProfile.team.map(p => {
        const stats = calculateStats(p.id, p.level);
        const info = getAnimalDisplayInfo(p.id);
        return {
            ...p.toObject(),
            emoji: info.emoji,
            hp: stats.hp,
            max_hp: stats.max_hp,
            armor: stats.armor, 
            max_armor: stats.armor, 
            atk: stats.atk
        };
    });

    
    let round = 1;
    const maxRounds = 20;

    const dealDamage = (attacker, defender) => {
        if (defender.hp <= 0) return;
        const damage = attacker.atk;
        const isArmorHit = Math.random() < 0.5; 

        if (isArmorHit && defender.armor > 0) {
            defender.armor -= damage;
            if (defender.armor < 0) {
                defender.hp += defender.armor; 
                defender.armor = 0;
            }
        } else {
            defender.hp -= damage;
        }
    };

    while (userTeamBattle.some(p => p.hp > 0) && enemyTeam.some(p => p.hp > 0) && round <= maxRounds) {
        userTeamBattle.forEach((u, idx) => {
            if (u.hp <= 0) return;
            let target = enemyTeam[idx];
            if (!target || target.hp <= 0) target = enemyTeam.find(e => e.hp > 0);
            if (target) dealDamage(u, target);
        });

        enemyTeam.forEach((e, idx) => {
            if (e.hp <= 0) return;
            let target = userTeamBattle[idx];
            if (!target || target.hp <= 0) target = userTeamBattle.find(u => u.hp > 0);
            if (target) dealDamage(e, target);
        });
        round++;
    }

    
    const userWin = userTeamBattle.some(p => p.hp > 0);
    const resultColor = userWin ? 'Green' : 'Red';
    
    let moneyMsg = "";
    let expGained = 0;
    let streakBonus = "";

    if (userWin) {
        const moneyReward = Math.floor(Math.random() * (winRange[1] - winRange[0] + 1)) + winRange[0];
        await economy.addMoney(userId, moneyReward);
        moneyMsg = `+${moneyReward.toLocaleString('vi-VN')} 🪙`;

        const baseExp = configExp;
        const bonusMultiplier = 1 + (userProfile.win_streak * 0.05);
        expGained = Math.floor(baseExp * bonusMultiplier);
        
        userProfile.win_streak += 1;
        userProfile.total_wins += 1;
        
        if (userProfile.win_streak > 1) streakBonus = `(Streak ${userProfile.win_streak} 🔥)`;

        
        await updateMissionProgress(userId, 'battle_win', 1);
        await updateMissionProgress(userId, 'battle_streak', 1);

        
        const totalRemainingHP = userTeamBattle.reduce((sum, p) => sum + Math.max(0, p.hp), 0);
        if (totalRemainingHP === 1) {
            await updateMissionProgress(userId, 'battle_clutch', 1);
        }

    } else {
        moneyMsg = `0 🪙`;
        userProfile.win_streak = 0;
        expGained = 10;

        
        await updateMissionProgress(userId, 'battle_streak', 0, true); 
    }
    userProfile.total_matches += 1;

    
    for (const pet of userProfile.team) {
        pet.exp += expGained;
        
        let oldLevel = pet.level;
        while (pet.level < 25 && pet.exp >= LEVEL_EXP[pet.level + 1]) {
            pet.level++;
        }
        if (pet.level >= 25) pet.exp = LEVEL_EXP[25];

        
        if (pet.level > oldLevel) {
            if (pet.level >= 2) await updateMissionProgress(userId, 'pet_levelup', 1);
            if (pet.level >= 5) await updateMissionProgress(userId, 'team_lv5', 1);
            if (pet.level >= 10) await updateMissionProgress(userId, 'pet_lv10', 1);
        }
    }
    
    userProfile.last_battle = now;
    await userProfile.save();

    
    const s = '\u00A0\u00A0'; 
    const sep = '\u00A0\u00A0'; 

    const renderUnit = (unit) => {
        const dead = unit.hp <= 0;
        const hpStr = `${Math.max(0, unit.hp)}/${unit.max_hp}`;
        const armorStr = `${Math.max(0, unit.armor)}/${unit.max_armor}`;
        const icon = unit.emoji; 
        const deadMarker = dead ? "💀" : "";
        const levelStr = unit.level.toString().padEnd(2, ' ');
        return `lv.${levelStr}|${icon}${s}\`[${hpStr}]\`${sep}\`[${armorStr}]\`${sep}\`[${unit.atk}]\`${deadMarker}`;
    };

    let userField = "";
    userTeamBattle.forEach(p => userField += renderUnit(p) + "\n");

    let enemyField = "";
    enemyTeam.forEach(p => enemyField += renderUnit(p) + "\n");

    const embed = new EmbedBuilder()
        .setTitle(`**Đấu Trường Thú** - ${userWin ? "Chiến Thắng" : "Thất Bại"}`)
        .setColor(resultColor)
        .setDescription(`-------------------------------------
**${message.author.username}** \u00A0\u00A0\u00A0\u00A0 HP \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 AMR \u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0 ATK
${userField}==============================
${enemyField}==============================

**Kết Quả:** ${moneyMsg}
**Kinh Nghiệm:** +${expGained} EXP ${streakBonus}`);

    message.channel.send({ embeds: [embed] });
}


async function handleBattleInfo(message, args) {
    if (args.length === 0) return message.reply("Cú pháp: `.binfo <tên thú>`");
    
    const userId = message.author.id;
    const keyword = args.join(' ').toLowerCase();

    let battleProfile = await BattleProfile.findOne({ user_id: userId });
    let targetPet = null;
    let isTeamPet = false;

    if (battleProfile && battleProfile.team.length > 0) {
        targetPet = battleProfile.team.find(p => 
            p.name.toLowerCase().includes(keyword) || 
            p.origin_name.toLowerCase().includes(keyword)
        );
    }

    let stats = null;
    let displayInfo = null;
    let petName = "";
    let levelDisplay = 0;

    if (targetPet) {
        isTeamPet = true;
        const animalId = targetPet.id;
        displayInfo = getAnimalDisplayInfo(animalId);
        stats = calculateStats(animalId, targetPet.level);
        petName = targetPet.name; 
        levelDisplay = targetPet.level;
    } else {
        const animalId = resolveAnimalId(keyword);
        if (!animalId) return message.reply("Không tìm thấy thông tin về loài thú này (Chưa sở hữu hoặc tên sai).");
        
        displayInfo = getAnimalDisplayInfo(animalId);
        stats = calculateStats(animalId, 0); 
        petName = displayInfo.name; 
        levelDisplay = 0;
    }

    const embed = new EmbedBuilder()
        .setColor(isTeamPet ? 'Green' : 'Blue')
        .setTitle(`📖 Thông Tin Thú Cưng`)
        .setDescription(
            `**${petName}** ${displayInfo.emoji}\n` +
            `|Máu: \`[${stats.hp}]\`\n` +
            `|Giáp: \`[${stats.armor}]\`\n` +
            `|Công: \`[${stats.atk}]\``
        );
        
    if (isTeamPet) {
        embed.setFooter({ text: `Level: ${levelDisplay} | EXP: ${targetPet.exp}` });
    } else {
        embed.setFooter({ text: "Thông số cơ bản (Level 0)" });
    }

    message.channel.send({ embeds: [embed] });
}


async function handleSetBattleCooldown(message, args) {
    if (message.author.id !== OWNER_ID) {
        return message.reply("⛔ Bạn không có quyền admin.");
    }
    
    const time = parseInt(args[0]);
    if (isNaN(time) || time < 0) return message.reply("Vui lòng nhập thời gian (giây) hợp lệ.");
    
    if (GAME_CONFIG.battle) {
        GAME_CONFIG.battle.cooldown = time;
    }
    await saveConfig('GAME_CONFIG');
    return message.reply(`Đã thiết lập thời gian hồi chiêu Battle là **${time}s** (Áp dụng ngay).`);
}

module.exports = { handleTeam, handleRename, handleBattle, handleBattleInfo, handleSetBattleCooldown };