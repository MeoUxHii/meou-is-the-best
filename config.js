const { ButtonStyle } = require('discord.js');
const E = require('./emoji'); 

const ALLOWED_CHANNEL_ID = '1458596858808107171';
const ADMIN_ROLE_ID = '528102047770476544'; 
const CURRENCY = E.SYSTEM.COIN;
const ADMIN_CREDENTIALS = {
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD
};

const DEFAULT_CONFIG = {
    REWARD_BASE: 100,       
    REWARD_PER_WORD: 120,    
    REWARD_MAX: 2500,       
    COOLDOWN_TURNS: 50 
};
const GAME_CONFIG = {
    maxBetDaGa: 15000,
    maxBetXiDach: 10000, 
    maxBetBauCua: 15000, 
    winRateDaGaBase: 0.46, 
    winRateDaGaMax: 0.75,  
    winRateChickenBox: 0.40, 
    winRateChickenBoxStreak: 0.05,
    bauCuaTime: 30, 
    minBetRoulette: 100,         
    maxBetRoulette: 5000,      
    maxTotalBetRoulette: 15000, 
    rouletteCountdown: 30,
    minBetRace: 100,
    maxBetRace: 5000,
    raceTrackLength: 28,
    racePayoutRate: 3, 
    raceBetTime: 30,    
    dropRateLootbox: 0.1, 
    dropRateLootboxVip: 0.05,
    minBet: 1,
    maxBetPerTurn: 5000,
    maxTotalBet: 15000,    
    countdown: 30 
};


const UNO_CONFIG = {
    COLORS: ['🔴', '🔵', '🟢', '🟡'],
    TYPES: { NUMBER: 'number', SKIP: 'skip', REVERSE: 'reverse', DRAW2: 'draw2', WILD: 'wild', WILD4: 'wild4' }
};

const SHOP_ITEMS = {
    luckybox: {
        id: 'luckybox', keywords: ['luck', 'lucky', 'luckybox', 'box'], name: 'Lucky Box', price: 500, stock: 100, 
        description: 'Hộp may mắn tùy vào nhân phẩm của bạn.', useDescription: 'Gõ **`.roll 10`** để thử vận may.\n👉 **1-3-4-7-8-9**: Còn đúng cái nịt.\n👉 **2-5-6**: Trúng **1500** 🪙\n👉 **10**: Giải đặc biệt **2500** 🪙'
    },
    chickenbox: {
        id: 'chickenbox', keywords: ['chi', 'chic', 'chicke', 'chicken', 'chickenbox', 'ga'], name: 'Chicken Box', price: 1500, stock: 100, 
        description: 'Gà chiến của anh quá dữuuuu.', useDescription: 'Game Đá Gà đã bắt đầu! Gõ **`.dg`** để chiến.'
    },
    lootbox: {
        id: 'lootbox', keywords: ['loot', 'box', 'lootbox', 'box', 'lb'], name: 'Lootbox', price: 1000, stock: 1000, 
        description: 'Không ai biết bên trong có gì nhưng người ta chắc chắn rằng có thể mở ra thứ gì đó quý giá. .', useDescription: 'Gõ `.use lb` để mở.', emoji: E.ITEMS.LOOTBOX 
    },
    lootboxvip: {
        id: 'lootboxvip', keywords: ['vip', 'lootboxvip', 'box', 'lbvip'], name: 'Lootbox VIP', price: 5000, stock: 50, 
        description: 'Bề ngoài lấp lánh này chắc chắn sẽ mở ra một viên ngọc quý, nhưng quý như vậy tại sao nó lại ở đây?', useDescription: 'Gõ `.use lbvip` để mở.', emoji: E.ITEMS.LOOTBOX_VIP 
    },
    crate: {
        id: 'crate', keywords: ['crate', 'nomal', 'create', 'homthuong', 'nc', 'nomal create'], name: 'Nomal Create', price: 0, stock: 0, 
        description: 'Những chiếc hòm này nằm rải rác trong những khu rừng.', useDescription: 'Gõ `.use nc` để mở.', emoji: E.ITEMS.CRATE 
    },
    crateL: {
        id: 'crateL', keywords: ['cratel', 'legend', 'createl', 'homvip', 'lc', 'legend create'], name: 'Legend Create', price: 0, stock: 0, 
        description: 'Một chiếc hòm lấp lánh tìm thấy trong tầng cuối cùng của hầm ngục.', useDescription: 'Gõ `.use lc` để mở.', emoji: E.ITEMS.CRATE_L 
    },

    
    gem1: { id: 'gem1', name: 'Thô Thạch', keywords: ['gem1', 'thothach'], price: 0, stock: 9999, emoji: E.GEMS.gem1 },
    gem2: { id: 'gem2', name: 'Thanh Lưu', keywords: ['gem2', 'thanhngoc'], price: 0, stock: 9999, emoji: E.GEMS.gem2 },
    gem3: { id: 'gem3', name: 'Lam Bảo', keywords: ['gem3', 'lambao'], price: 0, stock: 9999, emoji: E.GEMS.gem3 },
    gem4: { id: 'gem4', name: 'Tử Tinh', keywords: ['gem4', 'tutinh'], price: 0, stock: 9999, emoji: E.GEMS.gem4 },
    gem5: { id: 'gem5', name: 'Huyết Ngọc', keywords: ['gem5', 'huyetngoc'], price: 0, stock: 9999, emoji: E.GEMS.gem5 },
    gem6: { id: 'gem6', name: 'Thiên Châu', keywords: ['gem6', 'thienchau'], price: 0, stock: 9999, emoji: E.GEMS.gem6 },
    gem7: { id: 'gem7', name: 'Huyền Bích', keywords: ['gem7', 'huyenbich'], price: 0, stock: 9999, emoji: E.GEMS.gem7 },

    
    gem1a: { id: 'gem1a', name: 'Nham Sa', keywords: ['gem1a', 'nhamsa'], price: 0, stock: 9999, emoji: E.GEMS.gem1a },
    gem2a: { id: 'gem2a', name: 'Lục Tỉ', keywords: ['gem2a', 'lucti'], price: 0, stock: 9999, emoji: E.GEMS.gem2a },
    gem3a: { id: 'gem3a', name: 'Mã Não', keywords: ['gem3a', 'manao'], price: 0, stock: 9999, emoji: E.GEMS.gem3a },
    gem4a: { id: 'gem4a', name: 'Hổ Phách', keywords: ['gem4a', 'hophach'], price: 0, stock: 9999, emoji: E.GEMS.gem4a },
    gem5a: { id: 'gem5a', name: 'Lưu Ly', keywords: ['gem5a', 'luuly'], price: 0, stock: 9999, emoji: E.GEMS.gem5a },
    gem6a: { id: 'gem6a', name: 'Hoàng Bảo', keywords: ['gem6a', 'hoangbao'], price: 0, stock: 9999, emoji: E.GEMS.gem6a },
    gem7a: { id: 'gem7a', name: 'Thiên Thủy', keywords: ['gem7a', 'thienthuy'], price: 0, stock: 9999, emoji: E.GEMS.gem7a },

    gem_special: { id: 'gem_special', name: 'Linh Quang', keywords: ['gem_special', 'linhquang', 'special'], price: 0, stock: 9999, emoji: E.GEMS.gem_special }
};
const GEM_PRICE_RANGES = {
    
    gem1: { min: 150, max: 350 },
    gem2: { min: 350, max: 750 },
    gem3: { min: 700, max: 1200 },
    gem4: { min: 1200, max: 2100 },
    gem5: { min: 3500, max: 5500 },
    gem6: { min: 5000, max: 12000 },
    gem7: { min: 10000, max: 50000 },


    gem1a: { min: 250, max: 500 },
    gem2a: { min: 500, max: 850 },
    gem3a: { min: 800, max: 1400 },
    gem4a: { min: 1400, max: 2500 },
    gem5a: { min: 4500, max: 9000 },
    gem6a: { min: 4000, max: 18000 },
    gem7a: { min: 10000, max: 65000 },

    gem_special: { min: 35000, max: 150000 }
};
const GEM_RATES = [
    { id: 'gem1', rate: 25.0 }, 
    { id: 'gem2', rate: 25.0 }, 
    { id: 'gem3', rate: 25.0 },
    { id: 'gem4', rate: 20.0 }, 
    { id: 'gem5', rate: 4.35 }, 
    { id: 'gem6', rate: 0.5 }, 
    { id: 'gem7', rate: 0.1 },
    { id: 'gem_special', rate: 0.05 } 
];


const GEM_RATES_CRATE = [
    { id: 'gem1a', rate: 25.0 }, 
    { id: 'gem2a', rate: 25.0 }, 
    { id: 'gem3a', rate: 25.0 },
    { id: 'gem4a', rate: 20.0 }, 
    { id: 'gem5a', rate: 4.35 }, 
    { id: 'gem6a', rate: 0.5 }, 
    { id: 'gem7a', rate: 0.1 },
    { id: 'gem_special', rate: 0.05 } 
];

const GEM_RATES_VIP = [
    { id: 'gem1', rate: 0.0 }, 
    { id: 'gem2', rate: 5.0 }, 
    { id: 'gem3', rate: 15.0 },
    { id: 'gem4', rate: 40.0 }, 
    { id: 'gem5', rate: 30.0 }, 
    { id: 'gem6', rate: 8.9 }, 
    { id: 'gem7', rate: 1.0 },
    { id: 'gem_special', rate: 0.1 } 
];

const GEM_RATES_CRATE_L = [
    { id: 'gem1a', rate: 0.0 }, 
    { id: 'gem2a', rate: 5.0 }, 
    { id: 'gem3a', rate: 15.0 },
    { id: 'gem4a', rate: 40.0 }, 
    { id: 'gem5a', rate: 30.0 }, 
    { id: 'gem6a', rate: 8.9 }, 
    { id: 'gem7a', rate: 1.0 },
    { id: 'gem_special', rate: 0.1 } 
];


const HORSES = [
    { id: 'jack', name: "J97", icon: E.HORSES.jack },
    { id: 'peter', name: "MTP", icon: E.HORSES.peter },
    { id: 'ani', name: "MCK", icon: E.HORSES.ani },
    { id: 'lan', name: "LowG", icon: E.HORSES.lan },
    { id: 'mai', name: "Faker", icon: E.HORSES.mai },
    { id: 'kien', name: "CR7", icon: E.HORSES.kien },
    { id: 'oanh', name: "Oanh", icon: E.HORSES.oanh },
    { id: 'hieu', name: "Hiếu", icon: E.HORSES.hieu }
];

const ANIMALS = {
    bau: { name: " Bầu ", emoji: E.BAUCUA.bau, style: ButtonStyle.Success, keywords: ['bau', 'bầu'] },
    cua: { name: " Cua ", emoji: E.BAUCUA.cua, style: ButtonStyle.Success, keywords: ['cua'] },
    tom: { name: " Tôm ", emoji: E.BAUCUA.tom, style: ButtonStyle.Success, keywords: ['tom', 'tôm'] },
    ca:  { name: "  Cá  ", emoji: E.BAUCUA.ca, style: ButtonStyle.Success, keywords: ['ca', 'cá'] },
    ga:  { name: "  Gà  ", emoji: E.BAUCUA.ga, style: ButtonStyle.Success, keywords: ['ga', 'gà'] },
    nai: { name: " Nai ", emoji: E.BAUCUA.nai, style: ButtonStyle.Success, keywords: ['nai'] }
};

const ANIMAL_STATS = {
    
    'sen': { hp: 50, armor: 30, atk: 35, class: 'C' },
    'kien': { hp: 65, armor: 25, atk: 30, class: 'C' },
    'ong': { hp: 75, armor: 20, atk: 25, class: 'C' },
    'buom': { hp: 85, armor: 15, atk: 20, class: 'C' },
    'sau': { hp: 100, armor: 10, atk: 15, class: 'C' },

    
    'meo': { hp: 110, armor: 60, atk: 65, class: 'U' },
    'soc': { hp: 135, armor: 52, atk: 58, class: 'U' },
    'doi': { hp: 155, armor: 45, atk: 52, class: 'U' },
    'ga': { hp: 180, armor: 37, atk: 46, class: 'U' },
    'vit': { hp: 200, armor: 30, atk: 40, class: 'U' },

    
    'cong': { hp: 210, armor: 70, atk: 95, class: 'R' },
    'cuu': { hp: 235, armor: 65, atk: 85, class: 'R' },
    'ngua': { hp: 260, armor: 60, atk: 75, class: 'R' },
    'bo': { hp: 285, armor: 55, atk: 68, class: 'R' },
    'voi': { hp: 300, armor: 50, atk: 60, class: 'R' },

    
    'vet': { hp: 310, armor: 80, atk: 125, class: 'E' },
    'khi_dot': { hp: 335, armor: 75, atk: 115, class: 'E' }, 
    'bao': { hp: 360, armor: 70, atk: 100, class: 'E' },
    'ho': { hp: 385, armor: 65, atk: 90, class: 'E' },
    'te_giac': { hp: 400, armor: 60, atk: 80, class: 'E' },

    
    'cong_than': { hp: 415, armor: 90, atk: 160, class: 'M' },
    'phuong': { hp: 435, armor: 86, atk: 150, class: 'M' },
    'ki_lan': { hp: 455, armor: 82, atk: 140, class: 'M' },
    'nguoi_tuyet': { hp: 475, armor: 78, atk: 130, class: 'M' },
    'khung_long': { hp: 490, armor: 74, atk: 120, class: 'M' },
    'ca_voi': { hp: 500, armor: 70, atk: 110, class: 'M' },

    
    'tom': { hp: 510, armor: 100, atk: 190, class: 'G' },
    'nhen': { hp: 535, armor: 95, atk: 175, class: 'G' },
    'ca': { hp: 560, armor: 90, atk: 160, class: 'G' },
    'lac_da': { hp: 585, armor: 85, atk: 145, class: 'G' },
    'gau_truc': { hp: 600, armor: 80, atk: 130, class: 'G' },

    
    'cu': { hp: 610, armor: 120, atk: 220, class: 'L' },
    'cao': { hp: 635, armor: 115, atk: 205, class: 'L' },
    'huu': { hp: 660, armor: 110, atk: 190, class: 'L' },
    'bach_tuoc': { hp: 685, armor: 105, atk: 175, class: 'L' },
    'su_tu': { hp: 700, armor: 100, atk: 160, class: 'L' },

    
    'ech': { hp: 900, armor: 150, atk: 300, class: 'F' },
    'chim_ung': { hp: 915, armor: 142, atk: 285, class: 'F' },
    'khi_f': { hp: 930, armor: 135, atk: 275, class: 'F' }, 
    'cho_f': { hp: 945, armor: 128, atk: 265, class: 'F' }, 
    'heo_f': { hp: 960, armor: 120, atk: 250, class: 'F' }, 
};


const LEVEL_EXP = [
    0,      
    50,     
    200,    
    450,    
    800,    
    1300,   
    2000,   
    2950,   
    4200,   
    5800,   
    7800,   
    10300,  
    13400,  
    17200,  
    21800,  
    27300,  
    33800,  
    41400,  
    50200,  
    60300,  
    71800,  
    84800,  
    99800,  
    117300, 
    137800, 
    162800  
];


const MILESTONES = {
    5:  { hp_bonus_pct: 0.15, armor_bonus: 5 },
    10: { hp_bonus_pct: 0.35, armor_bonus: 15 },
    15: { hp_bonus_pct: 0.60, armor_bonus: 30 },
    20: { hp_bonus_pct: 0.75, armor_bonus: 40 },
    25: { hp_bonus_pct: 0.90, armor_bonus: 50 }
};


function calculateStats(animalId, level) {
    const base = ANIMAL_STATS[animalId];
    if (!base) return null; 

    
    let milestone = { hp_bonus_pct: 0, armor_bonus: 0 };
    
    if (level >= 25) milestone = MILESTONES[25];
    else if (level >= 20) milestone = MILESTONES[20];
    else if (level >= 15) milestone = MILESTONES[15];
    else if (level >= 10) milestone = MILESTONES[10];
    else if (level >= 5)  milestone = MILESTONES[5];

    
    const finalHp = Math.floor(base.hp * (1 + milestone.hp_bonus_pct));
    
    
    const finalArmor = base.armor + milestone.armor_bonus;
    
    
    const finalAtk = Math.floor(base.atk * (1 + (level * 0.02))); 

    return {
        ...base,
        hp: finalHp,
        max_hp: finalHp,
        armor: finalArmor, 
        max_armor: finalArmor,
        atk: finalAtk
    };
}

const HUNT_CONFIG = {
    COOLDOWN: 2, 
    PRICE: 0,  
    
    
    CLASSES: {
        'U': { rate: 35.94, emoji: E.ZOO.CLASSES.U, name: "Common" },
        'C': { rate: 30.0,  emoji: E.ZOO.CLASSES.C, name: "Uncommon" },
        'R': { rate: 20.0,  emoji: E.ZOO.CLASSES.R, name: "Rare" },
        'E': { rate: 10.0,  emoji: E.ZOO.CLASSES.E, name: "Epic" },
        'M': { rate: 3.5,   emoji: E.ZOO.CLASSES.M, name: "Mythical" },
        'G': { rate: 0.5,   emoji: E.ZOO.CLASSES.G, name: "Godly" },
        'L': { rate: 0.05,  emoji: E.ZOO.CLASSES.L, name: "Legendary" },
        'F': { rate: 0.01,  emoji: E.ZOO.CLASSES.F, name: "Fable" }
    },

    BUFF_RATES_PERCENTAGE: {
        'R': 50.0, 'E': 70.0, 'M': 70.0, 'G': 100.0, 'L': 100.0, 'F': 100.0 
    },

    GEM_BUFFS: {
        'gem1a': { type: 'quantity', bonus: 1, turns: 20 },
        'gem2a': { type: 'quantity', bonus: 1, turns: 30 },
        'gem3a': { type: 'quantity', bonus: 2, turns: 35 },
        'gem4a': { type: 'quantity', bonus: 2, turns: 35 },
        'gem5a': { type: 'quantity', bonus: 3, turns: 40 },
        'gem6a': { type: 'quantity', bonus: 3, turns: 50 },
        'gem7a': { type: 'quantity', bonus: 4, turns: 100 },
        'gem1': { type: 'quality', bonus: 0, turns: 10 }, 
        'gem2': { type: 'quality', bonus: 0, turns: 20 },
        'gem3': { type: 'quality', bonus: 0, turns: 30 },
        'gem4': { type: 'quality', bonus: 0, turns: 35 },
        'gem5': { type: 'quality', bonus: 0, turns: 40 },
        'gem6': { type: 'quality', bonus: 0, turns: 50 },
        'gem7': { type: 'quality', bonus: 0, turns: 100 },
    },

    ANIMALS: {
        'U': [
            { id: 'ga', name: 'Gà', emoji: '🐓', rate: 0.20, price: 5 },
            { id: 'vit', name: 'Vịt', emoji: '🦆', rate: 0.20, price: 7 },
            { id: 'soc', name: 'Sóc', emoji: '🐿️', rate: 0.20, price: 9 },
            { id: 'doi', name: 'Dơi', emoji: '🦇', rate: 0.20, price: 11 },
            { id: 'meo', name: 'Mèo', emoji: '🐈', rate: 0.20, price: 14 }
        ],
        'C': [
            { id: 'sau', name: 'Sâu', emoji: '🐛', rate: 0.20, price: 15 },
            { id: 'sen', name: 'Sên', emoji: '🐌', rate: 0.20, price: 19 },
            { id: 'kien', name: 'Kiến', emoji: '🐜', rate: 0.20, price: 22 },
            { id: 'buom', name: 'Bướm', emoji: '🦋', rate: 0.20, price: 25 },
            { id: 'ong', name: 'Ong', emoji: '🐝', rate: 0.20, price: 28 }
        ],
        'R': [
            { id: 'cuu', name: 'Cừu', emoji: '🐑', rate: 0.20, price: 35 },
            { id: 'bo', name: 'Bò', emoji: '🐄', rate: 0.20, price: 37 },
            { id: 'voi', name: 'Voi', emoji: '🐘', rate: 0.20, price: 39 },
            { id: 'cong', name: 'Công', emoji: '🦚', rate: 0.20, price: 40 },
            { id: 'ngua', name: 'Ngựa', emoji: '🐎', rate: 0.20, price: 48 }
        ],
        'E': [
            { id: 'vet', name: 'Vẹt', emoji: '🦜', rate: 0.20, price: 60 },
            { id: 'te_giac', name: 'Tê Giác', emoji: '🦏', rate: 0.20, price: 65 },
            { id: 'khi_dot', name: 'Khỉ Đột', emoji: '🦧', rate: 0.20, price: 75 },
            { id: 'bao', name: 'Báo', emoji: '🐆', rate: 0.20, price: 85 },
            { id: 'ho', name: 'Hổ', emoji: '🐯', rate: 0.20, price: 99 }
        ],
        'M': [
            { id: 'khung_long', name: 'Khủng Long', emoji: '🦖', rate: 0.20, price: 120 },
            { id: 'ca_voi', name: 'Cá Voi', emoji: '🐳', rate: 0.20, price: 160 },
            { id: 'nguoi_tuyet', name: 'Người Tuyết', emoji: '☃️', rate: 0.20, price: 180 },
            { id: 'ki_lan', name: 'Kì Lân', emoji: '🦄', rate: 0.20, price: 190 },
            { id: 'phuong', name: 'Phượng', emoji: '🐦‍🔥', rate: 0.20, price: 220 }
        ],
        'G': [
            { id: 'ca', name: 'Cá', emoji: E.ZOO.GODLY.fish, rate: 0.30, price: 400 },
            { id: 'lac_da', name: 'Lạc Đà', emoji: E.ZOO.GODLY.camel, rate: 0.30, price: 550 },
            { id: 'gau_truc', name: 'Gấu Trúc', emoji: E.ZOO.GODLY.panda, rate: 0.20, price: 650 },
            { id: 'tom', name: 'Tôm', emoji: E.ZOO.GODLY.shrimp, rate: 0.10, price: 800 },
            { id: 'nhen', name: 'Nhện', emoji: E.ZOO.GODLY.spider, rate: 0.10, price: 990 }
        ],
        'L': [
            { id: 'huu', name: 'Hươu', emoji: E.ZOO.LEGENDARY.deer, rate: 0.30, price: 1220 },
            { id: 'cao', name: 'Cáo', emoji: E.ZOO.LEGENDARY.fox, rate: 0.30, price: 1550 },
            { id: 'su_tu', name: 'Sư Tử', emoji: E.ZOO.LEGENDARY.lion, rate: 0.20, price: 1700 },
            { id: 'bach_tuoc', name: 'Bạch Tuộc', emoji: E.ZOO.LEGENDARY.squid, rate: 0.10, price: 1900 },
            { id: 'cu_meo', name: 'Cú Mèo', emoji: E.ZOO.LEGENDARY.owl, rate: 0.10, price: 2200 }
        ],
        'F': [
            { id: 'heo_f', name: 'Bát Giới', emoji: E.ZOO.FABLE.pig, rate: 0.35, price: 2400 },
            { id: 'chim_ung', name: 'Ưng Điểu', emoji: E.ZOO.FABLE.eagle, rate: 0.30, price: 2900 },
            { id: 'ech', name: 'Ếch', emoji: E.ZOO.FABLE.frog, rate: 0.15, price: 3200 },
            { id: 'khi_f', name: 'Ngộ Không', emoji: E.ZOO.FABLE.monkey, rate: 0.15, price: 5000 },
            { id: 'cho_f', name: 'Hạo Thiên Khuyển', emoji: E.ZOO.FABLE.dog, rate: 0.05, price: 25000 }
        ]
    }
};

module.exports = {
    ALLOWED_CHANNEL_ID, ADMIN_ROLE_ID, CURRENCY, ADMIN_CREDENTIALS,
    GAME_CONFIG, SHOP_ITEMS, 
    GEM_RATES, GEM_RATES_VIP, GEM_RATES_CRATE, GEM_RATES_CRATE_L,
    ANIMALS, HORSES, UNO_CONFIG, ANIMAL_STATS, LEVEL_EXP, MILESTONES,GEM_PRICE_RANGES, HUNT_CONFIG, DEFAULT_CONFIG, calculateStats
};
