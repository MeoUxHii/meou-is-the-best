const { SystemConfigDB } = require('../database/models');
const ConfigFile = require('../config'); 

// THÊM: GEM_RATES_CRATE và GEM_RATES_CRATE_L vào danh sách
const SYNC_KEYS = [
    'GAME_CONFIG', 
    'GEM_RATES', 'GEM_RATES_VIP', 
    'GEM_RATES_CRATE', 'GEM_RATES_CRATE_L', 
    'GEM_PRICE_RANGES', 'HUNT_CONFIG'
];

async function loadGlobalConfig() {
    console.log("⏳ [Config] Đang tải cấu hình từ MongoDB...");
    
    try {
        const configs = await SystemConfigDB.find({});
        let loadedCount = 0;

        for (const record of configs) {
            if (SYNC_KEYS.includes(record.key)) {
                
                if (ConfigFile[record.key]) {
                    // Logic mới: Xử lý mảng (Array) thông minh hơn để không mất item mới
                    if (Array.isArray(ConfigFile[record.key]) && Array.isArray(record.value)) {
                        const dbArray = record.value;
                        const codeArray = ConfigFile[record.key]; 

                        // Tạo map từ DB để tra cứu nhanh
                        const dbMap = new Map(dbArray.map(i => [i.id, i]));

                        // Duyệt qua danh sách trong CODE (chuẩn). 
                        // Nếu DB có thì lấy số liệu từ DB (để giữ config cũ), nếu không thì lấy mặc định từ Code.
                        const mergedArray = codeArray.map(codeItem => {
                            const dbItem = dbMap.get(codeItem.id);
                            if (dbItem) {
                                // Gộp dữ liệu: Giữ lại cấu trúc code nhưng lấy giá trị rate từ DB
                                return { ...codeItem, ...dbItem }; 
                            }
                            // Item mới chưa có trong DB -> Dùng mặc định
                            return codeItem; 
                        });

                        // Cập nhật lại biến trong memory
                        ConfigFile[record.key].length = 0;
                        ConfigFile[record.key].push(...mergedArray);

                    } else {
                        // Với Object (như GAME_CONFIG, GEM_PRICE_RANGES), Object.assign sẽ tự giữ key mới
                        Object.assign(ConfigFile[record.key], record.value);
                    }
                    
                    loadedCount++;
                }
            }
        }

        console.log(`✅ [Config] Đã đồng bộ ${loadedCount} cấu hình từ Database.`);
        
        if (configs.length === 0) {
            console.log("⚠️ [Config] Database trống. Đang khởi tạo dữ liệu mặc định lên MongoDB...");
            await saveAllConfigs();
        } else {
            // Tự động lưu lại ngay để cập nhật các field mới vào DB
            await saveAllConfigs();
        }

    } catch (e) {
        console.error("❌ [Config] Lỗi khi tải config:", e);
    }
}

async function saveConfig(key) {
    if (!SYNC_KEYS.includes(key)) return;
    if (!ConfigFile[key]) return;

    try {
        await SystemConfigDB.findOneAndUpdate(
            { key: key },
            { value: ConfigFile[key] },
            { upsert: true, new: true }
        );
        console.log(`💾 [Config] Đã lưu ${key} vào MongoDB.`);
    } catch (e) {
        console.error(`❌ [Config] Lỗi lưu ${key}:`, e);
    }
}

async function saveAllConfigs() {
    for (const key of SYNC_KEYS) {
        await saveConfig(key);
    }
}

module.exports = { loadGlobalConfig, saveConfig, saveAllConfigs };