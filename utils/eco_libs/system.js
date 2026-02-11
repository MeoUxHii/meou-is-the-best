
const fs = require('fs');
const path = require('path');
const { CustomReply, DisabledCommand } = require('../../database/models');

module.exports = {
    
    
    async getConfig(guildId) {
        if (!this.settings.has(guildId)) {
            const newConfig = {
                guild_id: guildId, 
                prefix: '.', 
                currency: '🪙', 
                
                admin_roles: [], 
                game_channels: {},
                
                
                work_min: 100, work_max: 200, work_cd: 25,
                battle_cd: 10
            };
            this.settings.set(guildId, newConfig);
            this.dirty.settings.add(guildId);
        }
        return this.settings.get(guildId);
    },

    async updateConfig(guildId, key, value) {
        const config = await this.getConfig(guildId);
        config[key] = value;
        this.dirty.settings.add(guildId);
    },

    
    async setGameChannel(guildId, gameType, channelId) {
        const config = await this.getConfig(guildId);
        if (!config.game_channels) config.game_channels = {};
        
        if (config.game_channels instanceof Map) config.game_channels.set(gameType, channelId);
        else config.game_channels[gameType] = channelId;
        
        this.dirty.settings.add(guildId);
    },

    async getGameChannel(guildId, gameType) {
        const config = await this.getConfig(guildId);
        if (config.game_channels instanceof Map) return config.game_channels.get(gameType);
        return config.game_channels ? config.game_channels[gameType] : null;
    },

    
    async addAdminRole(guildId, roleId) {
        const config = await this.getConfig(guildId);
        if (!config.admin_roles.includes(roleId)) {
            config.admin_roles.push(roleId);
            this.dirty.settings.add(guildId);
        }
        return true;
    },
    async removeAdminRole(guildId, roleId) {
        const config = await this.getConfig(guildId);
        config.admin_roles = config.admin_roles.filter(id => id !== roleId);
        this.dirty.settings.add(guildId);
        return true;
    },

    
    
    async getReply(guildId, commandType, status, amount, currency) {
        const custom = this.replies.find(r => r.guild_id === guildId && r.command_type === commandType && r.status === status);
        let template = "";
        
        if (custom) {
            template = custom.message;
        } else {
            const fileName = `${status}.txt`;
            const filePath = path.join(__dirname, '..', '..', 'custom_reply', commandType, fileName);
            try {
                if (fs.existsSync(filePath)) {
                    const data = fs.readFileSync(filePath, 'utf8');
                    const lines = data.split(/\r?\n/).filter(line => line.trim() !== '');
                    if (lines.length > 0) template = lines[Math.floor(Math.random() * lines.length)];
                }
            } catch (e) {}
        }

        if (!template) template = `Bạn đã ${status} lệnh ${commandType} với {amount}`;
        return template.replace(/{amount}/g, `**${this.formatMoney(amount)} ${currency}**`);
    },

    async addReply(guildId, type, status, message) {
        const newReply = await CustomReply.create({ guild_id: guildId, command_type: type, status: status, message: message });
        this.replies.push(newReply.toObject());
    },
    
    async getCustomReplies(guildId, type) {
        return this.replies.filter(r => r.guild_id === guildId && r.command_type === type);
    },
    
    async deleteReply(id) {
        await CustomReply.findByIdAndDelete(id);
        this.replies = this.replies.filter(r => r._id.toString() !== id && r.id !== id);
    },

    
    async isCommandDisabled(channelId, command, aliases) {
        const canonical = aliases[command] || command;
        return this.disabledCmds.has(`${channelId}_${canonical}`);
    },
    async disableCommand(channelId, command) {
        await DisabledCommand.create({ channel_id: channelId, command: command });
        this.disabledCmds.add(`${channelId}_${command}`);
    },
    async enableCommand(channelId, command) {
        await DisabledCommand.deleteOne({ channel_id: channelId, command: command });
        this.disabledCmds.delete(`${channelId}_${command}`);
    },

    
    
    
    checkCooldown(guildId, userId, cmd, duration) {
        
        const key = `${userId}_${cmd}`;
        const now = Date.now();
        if (this.cooldowns.has(key)) {
            const exp = this.cooldowns.get(key);
            if (now < exp) return exp;
        }
        this.cooldowns.set(key, now + duration * 1000);
        return 0;
    },
    
    formatMoney(amount) {
    return parseInt(amount).toLocaleString('vi-VN');
    },

    
    
    async updateWordChainStats(guildId, userId, isWin) {
        
        const key = userId;
        let stats = this.wordChain.get(key);
        if (!stats) {
            stats = { user_id: userId, wins: 0, correct_words: 0 };
            this.wordChain.set(key, stats);
        }
        stats.correct_words++;
        if (isWin) stats.wins++;
        this.dirty.wordChain.add(key);
    }
};