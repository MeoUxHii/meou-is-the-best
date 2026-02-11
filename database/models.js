
const mongoose = require('mongoose');


const MONGO_URI = process.env.MONGO_URI; 

if (!MONGO_URI) {
    console.error("❌ ERROR: Chưa cấu hình MONGO_URI trong file .env!");
} else {
    mongoose.connect(MONGO_URI)
        .then(() => console.log("🍃 Đã kết nối MongoDB Atlas!"))
        .catch(err => console.error("❌ Lỗi kết nối MongoDB:", err));
}


const userSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    username: { type: String, default: "Unknown" },      
    display_name: { type: String, default: "Unknown" },  
    avatar: { type: String, default: null },             
    cash: { type: Number, default: 0 },
    bank: { type: Number, default: 0 },
    last_daily: { type: Date, default: null },
    streak: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },           
    level: { type: Number, default: 0 },        
    daily_xp: { type: Number, default: 0 },     
    last_xp_date: { type: String, default: "" },
    missions: {
        last_date: { type: String, default: '' }, 
        active: { type: Array, default: [] },
        history: { type: Array, default: [] } 
    }
});
const User = mongoose.model('User', userSchema);



const inventorySchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    item_id: { type: String, required: true },
    amount: { type: Number, default: 0 }
});
inventorySchema.index({ user_id: 1, item_id: 1 }, { unique: true });
const Inventory = mongoose.model('Inventory', inventorySchema);


const settingSchema = new mongoose.Schema({
    guild_id: { type: String, required: true, unique: true },
    prefix: { type: String, default: '.' },
    currency: { type: String, default: '🪙' },
    admin_roles: { type: [String], default: [] }, 
    game_channels: { type: Map, of: String, default: {} },
    
    work_min: { type: Number, default: 100 }, 
    work_max: { type: Number, default: 200 }, 
    work_cd: { type: Number, default: 25 },
    
    slut_min: { type: Number, default: 200 }, slut_max: { type: Number, default: 300 }, slut_cd: { type: Number, default: 25 }, slut_fail: { type: Number, default: 48 },
    crime_min: { type: Number, default: 200 }, crime_max: { type: Number, default: 300 }, crime_cd: { type: Number, default: 25 }, crime_fail: { type: Number, default: 48 },
    rob_cd: { type: Number, default: 25 }, rob_fail: { type: Number, default: 48 },
    
    battle_cd: { type: Number, default: 10 } 
});
const Setting = mongoose.model('Setting', settingSchema);


const shopItemSchema = new mongoose.Schema({
    item_id: { type: String, required: true, unique: true },
    stock: { type: Number, default: 0 },
    price: { type: Number, default: 0 }
});
const ShopItemDB = mongoose.model('ShopItem', shopItemSchema);


const wordChainSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    wins: { type: Number, default: 0 },
    correct_words: { type: Number, default: 0 }
});
const WordChainRank = mongoose.model('WordChainRank', wordChainSchema);

const wordSchema = new mongoose.Schema({
    word: { type: String, required: true, unique: true }
});
const WordDB = mongoose.model('Word', wordSchema);


const replySchema = new mongoose.Schema({
    guild_id: { type: String, required: true },
    command_type: { type: String, required: true },
    status: { type: String, required: true },
    message: { type: String, required: true }
});
const CustomReply = mongoose.model('CustomReply', replySchema);

const disabledCmdSchema = new mongoose.Schema({
    channel_id: { type: String, required: true },
    command: { type: String, required: true }
});
disabledCmdSchema.index({ channel_id: 1, command: 1 }, { unique: true });
const DisabledCommand = mongoose.model('DisabledCommand', disabledCmdSchema);


const zooSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    animals: { type: Map, of: Number, default: {} } 
});
const Zoo = mongoose.model('Zoo', zooSchema);

const gemHistorySchema = new mongoose.Schema({
    user_id: { type: String, required: true },
    item_id: { type: String, required: true }, 
    item_name: { type: String, required: true },
    time: { type: Date, default: Date.now }
});
const GemHistory = mongoose.model('GemHistory', gemHistorySchema);

const marketHistorySchema = new mongoose.Schema({
    gem_id: { type: String, required: true },
    price: { type: Number, required: true },
    total_in_server: { type: Number, default: 0 },
    time: { type: Date, default: Date.now }
});
marketHistorySchema.index({ gem_id: 1, time: -1 });
const MarketHistory = mongoose.model('MarketHistory', marketHistorySchema);


const userBuffSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    qty_gem_id: { type: String, default: null },
    qty_turns: { type: Number, default: 0 },
    qty_total: { type: Number, default: 0 },
    qual_gem_id: { type: String, default: null },
    qual_turns: { type: Number, default: 0 },
    qual_total: { type: Number, default: 0 }
});
const UserBuff = mongoose.model('UserBuff', userBuffSchema);


const battleProfileSchema = new mongoose.Schema({
    user_id: { type: String, required: true, unique: true },
    team: [{
        id: String,       
        name: String,     
        origin_name: String, 
        level: { type: Number, default: 0 },
        exp: { type: Number, default: 0 },
        joined_at: { type: Date, default: Date.now }
    }],
    win_streak: { type: Number, default: 0 },
    total_matches: { type: Number, default: 0 },
    total_wins: { type: Number, default: 0 },
    last_battle: { type: Date, default: null } 
});
const BattleProfile = mongoose.model('BattleProfile', battleProfileSchema);


const gameSessionSchema = new mongoose.Schema({
    channel_id: { type: String, required: true, unique: true },
    guild_id: { type: String, required: true },
    game_type: { type: String, required: true },
    data: { type: Object, default: {} },
    updated_at: { type: Date, default: Date.now }
});
const GameSession = mongoose.model('GameSession', gameSessionSchema);
const SystemConfig = new mongoose.Schema({
    key: { type: String, required: true, unique: true }, 
    value: { type: mongoose.Schema.Types.Mixed, default: {} } 
});
const SystemConfigDB = mongoose.model('SystemConfig', SystemConfig);

module.exports = {
    User, Inventory, Setting, ShopItemDB, 
    WordChainRank, WordDB, 
    CustomReply, DisabledCommand,
    Zoo, GemHistory, MarketHistory, UserBuff,
    BattleProfile, GameSession,SystemConfigDB
};