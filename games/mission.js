const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const economy = require('../utils/economy');
const { CURRENCY, SHOP_ITEMS, GAME_CONFIG } = require('../config');
const { BattleProfile } = require('../database/models'); 


const MISSION_DATA = {
    EASY: [
        { id: 'e1', name: "Công nhân chăm chỉ", desc: "Hãy chứng minh sự cần cù của bạn bằng cách sử dụng lệnh .work đủ 10 lần trong ngày hôm nay.", type: 'work', target: 10 },
        { id: 'e2', name: "Sống về đêm", desc: "Màn đêm là bạn đồng hành. Thực hiện lệnh .slut đủ 10 lần để hoàn thành chỉ tiêu.", type: 'slut', target: 10 },
        { id: 'e3', name: "Tội phạm đường phố", desc: "Thế giới ngầm đang vẫy gọi. Thực hiện lệnh .crime và trốn thoát thành công 5 lần.", type: 'crime_win', target: 5 },
        { id: 'e4', name: "Kiếm cơm", desc: `Không làm mà đòi có ăn? Tích lũy đủ 1000${CURRENCY} từ các công việc cơ bản (Work/Slut/Crime).`, type: 'earn_basic', target: 1000 },
        { id: 'e5', name: "Tiêu sản", desc: "Kích cầu nền kinh tế bằng cách ghé Shop và mua 5 vật phẩm bất kỳ.", type: 'buy_item', target: 5 },
        { id: 'e6', name: "Thương nhân", desc: `Tham gia thị trường chợ đen. Bán ngọc hoặc thú cưng và thu về ít nhất 1000${CURRENCY}.`, type: 'sell_money', target: 1000 },
        { id: 'e7', name: "Chia sẻ là hạnh phúc", desc: "Thể hiện lòng hảo tâm bằng cách dùng lệnh .give chuyển tiền cho 2 người chơi khác nhau.", type: 'give_money', target: 2 },
        { id: 'e8', name: "Người mở hòm", desc: "Thử vận may của bạn bằng cách mở 3 chiếc Lootbox thường.", type: 'open_lootbox', target: 3 },
        { id: 'e9', name: "Vận đỏ Bầu Cua", desc: "Tham gia sới bạc và giành chiến thắng trong game Bầu Cua 2 ván.", type: 'baucua_win', target: 2 },
        { id: 'e10', name: "Thợ lặn Xì Dách", desc: "Đánh bại nhà cái trong game Xì Dách 2 ván thắng.", type: 'xidach_win', target: 2 },
        { id: 'e11', name: "Gà chiến thắng", desc: "Mang gà đi đá và giành chiến thắng 2 trận oanh liệt.", type: 'chicken_win', target: 2 },
        { id: 'e12', name: "Tay đua nghiệp dư", desc: "Dự đoán chính xác ngựa về nhất trong game Đua Ngựa 2 lần.", type: 'race_win', target: 2 },
        { id: 'e13', name: "Roulette An Toàn", desc: "Chơi Roulette và thắng ở các cửa tỉ lệ 50/50 (Đỏ/Đen/Chẵn/Lẻ) 2 lần.", type: 'roulette_safe_win', target: 2 },
        { id: 'e14', name: "Làm nóng", desc: `Tham gia thị trường cá cược với tổng số tiền cược đạt 5000${CURRENCY} (Thắng thua đều tính).`, type: 'bet_total', target: 5000 },
        { id: 'e15', name: "Lãi ròng", desc: `Chứng minh kỹ năng cờ bạc bằng cách kiếm lãi ròng 2000${CURRENCY} từ các minigame (trừ bán đồ).`, type: 'casino_profit', target: 2000 },
        { id: 'e16', name: "Xì Dách An Toàn", desc: "Chiến thắng một ván Xì Dách với số điểm dằn bài (stand) từ 18 đến 20 điểm.", type: 'xidach_safe', target: 1 },
        { id: 'e17', name: "Săn Gà", desc: "Đặt cược vào linh vật Gà trong game Bầu Cua và thắng 2 lần.", type: 'baucua_ga', target: 2 },
        { id: 'e18', name: "Săn Tôm", desc: "Đặt cược vào linh vật Tôm trong game Bầu Cua và thắng 2 lần.", type: 'baucua_tom', target: 2 },
        { id: 'e19', name: "Thợ săn cần cù", desc: "Xách cung lên và đi. Sử dụng lệnh .hunt 10 lần để tìm kiếm thú cưng.", type: 'hunt', target: 10 },
        { id: 'e20', name: "Đầy túi", desc: "Bắt được tổng cộng 20 con thú các loại từ những chuyến đi săn.", type: 'catch_animal', target: 20 },
        { id: 'e21', name: "Không lấy rác", desc: "Bắt được ít nhất 2 con thú có phẩm chất Uncommon (U) trở lên.", type: 'catch_uncommon', target: 2 },
        { id: 'e22', name: "Chiến binh mới", desc: "Tham gia đấu trường thú .battle và giành chiến thắng 1 trận.", type: 'battle_win', target: 1 },
        { id: 'e23', name: "Đội hình chuẩn", desc: "Sắp xếp đầy đủ 3 thú cưng vào đội hình chiến đấu (.team add).", type: 'team_full', target: 1 },
        { id: 'e24', name: "Nâng cấp sức mạnh", desc: "Tiến hóa sức mạnh cho thú cưng bằng cách nâng 1 thú lên Level 2.", type: 'pet_levelup', target: 2 },
        { id: 'e25', name: "Thánh Nối Từ", desc: "Tham gia trò chơi nối từ và nối đúng 15 từ hợp lệ.", type: 'wordchain', target: 15 },
        { id: 'e26', name: "Fan UNO", desc: "Tham gia chơi hoàn chỉnh 2 ván UNO (Không bỏ cuộc giữa chừng).", type: 'uno_play', target: 2 },
        { id: 'e27', name: "Test nhân phẩm", desc: "Mua Luckybox trong shop và mở ra phần thưởng trúng giải.", type: 'luckybox_win', target: 1 },
        { id: 'e28', name: "Đại gia mới nổi", desc: `Cán mốc tổng tài sản (Tiền mặt + Ngân hàng) đạt 20000${CURRENCY}.`, type: 'check_balance', target: 20000 },
        { id: 'e29', name: "Dùng đồ", desc: "Sử dụng thành công 1 vật phẩm hỗ trợ (Buff Hunt, Chickenbox, v.v...).", type: 'use_item', target: 1 },
        { id: 'e30', name: "Điểm danh có quà", desc: "Thực hiện điểm danh .daily và may mắn nhận được Lootbox.", type: 'daily_box', target: 1 },
        { id: 'e31', name: "Tiếng gọi hoang dã", desc: "Nói '**Meo Meo**' 10 lần trong kênh bất kỳ (Mỗi lần cách nhau 3s).", type: 'chat_meo', target: 10 },
        { id: 'e32', name: "Người bạn trung thành", desc: "Nói '**Gâu Gâu**' 10 lần trong kênh bất kỳ (Mỗi lần cách nhau 3s).", type: 'chat_gau', target: 10 },
        { id: 'e33', name: "Dân chơi HDPE", desc: "Nói '**HDPE thì ngon luôn**' 10 lần trong kênh bất kỳ (Mỗi lần cách nhau 3s).", type: 'chat_hdpe', target: 10 },
        { id: 'e34', name: "Fan cứng Độ Mixi", desc: "Nói '**Anh Độ My Suy**' 10 lần trong kênh bất kỳ (Mỗi lần cách nhau 3s).", type: 'chat_do', target: 10 }
    ],
    MEDIUM: [
        { id: 'm1', name: "Tội phạm chuyên nghiệp", desc: "Thực hiện .crime thành công 3 lần liên tiếp mà không bị cảnh sát bắt.", type: 'crime_streak', target: 3 },
        { id: 'm2', name: "Kẻ đào mỏ", desc: `Chăm chỉ làm việc .work và kiếm được tổng cộng 1500${CURRENCY}.`, type: 'work_money', target: 1500 },
        { id: 'm3', name: "Đạo chích", desc: "Thực hiện một vụ cướp .rob thành công trót lọt từ người chơi khác.", type: 'rob_win', target: 1 },
        { id: 'm4', name: "Bầu Cua X2", desc: "Thắng một ván Bầu Cua mà trong đó bạn ăn được cả 2 cửa đã cược.", type: 'baucua_x2', target: 1 },
        { id: 'm5', name: "Thánh soi cầu", desc: "Giữ vững phong độ bằng cách thắng 2 ván Bầu Cua liên tiếp.", type: 'baucua_streak', target: 2 },
        { id: 'm6', name: "Xì Dách 21", desc: "Thắng một ván Xì Dách với số điểm tròn trĩnh 21 (Không tính Ngũ Linh/Xì Dách).", type: 'xidach_21', target: 1 },
        { id: 'm7', name: "Chủ sòng Xì Dách", desc: "Áp đảo nhà cái với 2 ván thắng Xì Dách liên tiếp.", type: 'xidach_streak', target: 2 },
        { id: 'm8', name: "Gà chiến", desc: "Huấn luyện gà chiến và thắng 2 trận Đá Gà liên tiếp.", type: 'chicken_streak', target: 2 },
        { id: 'm9', name: "Đua ngựa trúng mánh", desc: "Dự đoán thần sầu, thắng cược Đua Ngựa 3 lần.", type: 'race_win', target: 3 },
        { id: 'm10', name: "Đỏ hay Đen", desc: "Thắng Roulette bằng cách cược vào màu (Đỏ hoặc Đen) 2 lần.", type: 'roulette_color_win', target: 2 },
        { id: 'm11', name: "Thợ săn lành nghề", desc: "Thể hiện kỹ năng săn bắt bằng cách bắt được thú Godly (G).", type: 'catch_godly', target: 1 },
        { id: 'm12', name: "Mở hòm tay to", desc: "Đầu tư mở 5 Lootbox thường để tìm kiếm vận may.", type: 'open_lootbox', target: 5 },
        { id: 'm13', name: "Dân chơi VIP", desc: "Sang chảnh mở 1 Lootbox VIP để tìm kiếm bảo vật.", type: 'open_vip', target: 1 },
        { id: 'm14', name: "Vua lỳ đòn", desc: "Tham gia Battle và giành chiến thắng 5 trận liên tiếp.", type: 'battle_streak', target: 5 },
        { id: 'm15', name: "Nối từ siêu tốc", desc: "Phản xạ nhanh nhạy, nối đúng 20 từ trong game Nối Từ.", type: 'wordchain', target: 20 },
        { id: 'm16', name: "Uno Winner", desc: "Đánh bại các đối thủ và giành chiến thắng 2 ván UNO.", type: 'uno_win', target: 2 },
        { id: 'm17', name: "Nhà đầu tư", desc: `Rót vốn tổng cộng 5000${CURRENCY} vào các trò chơi may rủi.`, type: 'bet_total', target: 5000 },
        { id: 'm18', name: "Buôn lậu", desc: `Bán ngọc Lootbox cho chợ đen và thu về 5000${CURRENCY}.`, type: 'sell_gem_money', target: 5000 },
        { id: 'm20', name: "Xì Dách Dằn Non", desc: "Chiến thuật an toàn, thắng Xì Dách với điểm số thấp (16-18 điểm).", type: 'xidach_low_win', target: 1 },
        { id: 'm21', name: "Tay chơi Roulette", desc: "Thắng Roulette bằng cách cược vào các cửa nhân 3.", type: 'roulette_x3', target: 1 },
        { id: 'm22', name: "Gà Box", desc: "Sử dụng item ChickenBox và chiến thắng ít nhất 2 trận.", type: 'chickenbox_win', target: 2 },
        { id: 'm23', name: "Thợ săn Epic", desc: "Săn lùng và bắt được thú phẩm chất Mythical (M).", type: 'catch_mythical', target: 1 },
        { id: 'm24', name: "Tặng quà", desc: "Hào phóng tặng một Item bất kì trong kho cho người khác.", type: 'give_item', target: 1 },
        { id: 'm25', name: "Đội hình mạnh", desc: "Sở hữu ít nhất 1 thú cưng đạt Level 5 trong đội hình Battle.", type: 'team_lv5', target: 1 },
        { id: 'm26', name: "Săn bắt", desc: "Sử dụng Ngọc Buff (Tăng số lượng hoặc Tỉ lệ) khi đi Hunt.", type: 'hunt_buff', target: 1 },
        { id: 'm27', name: "Trùm sò", desc: `Cày cuốc kiếm được 2000${CURRENCY} chỉ từ lệnh .work.`, type: 'work_money', target: 2000 },
        { id: 'm29', name: "Triệu hồi sư", desc: "Sưu tập đủ 15 con thú phẩm chất Rare (R).", type: 'catch_rare', target: 15 },
        { id: 'm30', name: "Tay to", desc: `Chơi lớn, đặt cược một ván game bất kì trên 3000${CURRENCY}.`, type: 'bet_big', target: 3000 }
    ],
    HARD: [
        { id: 'h1', name: "Bàn Tay Vàng", desc: `Thực hiện phi vụ thế kỷ, Rob thành công trên 5000${CURRENCY} từ người khác.`, type: 'rob_big', target: 5000 },
        { id: 'h2', name: "Tội Phạm Truy Nã", desc: "Trở thành ông trùm tội phạm, Crime thành công 20 lần trong ngày.", type: 'crime_win', target: 20 },
        { id: 'h3', name: "Xì Dách Thần Thánh", desc: "Đạt bài Xì Dách (Át + Tây/10) hoặc Xì Bàn (2 Át) trong game.", type: 'xidach_special', target: 1 },
        { id: 'h4', name: "Ngũ Linh Hộ Thể", desc: "Chiến thắng ván bài Xì Dách với bộ bài Ngũ Linh (5 lá <= 21 điểm).", type: 'xidach_ngulinh', target: 1 },
        { id: 'h5', name: "Bầu Cua X3", desc: "Thắng lớn Bầu Cua khi linh vật bạn chọn xuất hiện 2 lần (x2 tiền thưởng).", type: 'baucua_x3', target: 1 },
        { id: 'h6', name: "Gà Điên Cuồng Nộ", desc: "Gà chiến bất bại, thắng 3 trận Đá Gà liên tiếp.", type: 'chicken_streak', target: 3 },
        { id: 'h7', name: "Vua Trường Đua", desc: "Dự đoán như thần, thắng Đua Ngựa 2 lần liên tiếp.", type: 'race_streak', target: 2 },
        { id: 'h8', name: "Bảo Tàng Sống", desc: "Săn lùng quái vật huyền thoại. Bắt được thú G, L hoặc F khi hunt.", type: 'catch_legend', target: 1 },
        { id: 'h9', name: "Mở Hòm Đại Gia", desc: "Mở Lootbox VIP và nhận được Ngọc Huyền Bích hoặc Thiên Châu.", type: 'open_gem_vip', target: 1 },
        { id: 'h10', name: "Mở Hòm Huyền Thoại", desc: "Mở Legend Crate và nhận được Ngọc Thiên Thủy hoặc Hoàng Bảo.", type: 'open_crate_legend', target: 1 },
        { id: 'h12', name: "Chiến Thần Battle", desc: "Bất khả chiến bại, thắng 10 trận Battle liên tiếp (Win Streak 10).", type: 'battle_streak', target: 10 },
        { id: 'h13', name: "Bậc Thầy Ngôn Ngữ", desc: "Bộ từ điển sống, nối đúng 50 từ trong game WordChain.", type: 'wordchain', target: 50 },
        { id: 'h14', name: "Vua Trò Chơi", desc: "Thống trị bàn chơi, thắng 3 ván UNO trong ngày.", type: 'uno_win', target: 3 },
        { id: 'h15', name: "Đại Gia Casino", desc: `Thắng tổng cộng hơn 20.000${CURRENCY} từ tất cả các game Casino trong ngày.`, type: 'casino_win_total', target: 20000 },
        { id: 'h16', name: "Thợ Săn Chăm Chỉ", desc: "Không ngừng nghỉ, thực hiện lệnh Hunt 20 lần trong ngày.", type: 'hunt', target: 20 },
        { id: 'h17', name: "Full Buff", desc: "Đi săn với trang bị tận răng: Kích hoạt cả Buff Số lượng và Buff Tỷ lệ cùng lúc.", type: 'hunt_full_buff', target: 1 },
        { id: 'h18', name: "Triệu Phú", desc: `Sở hữu khối tài sản khổng lồ (Cash + Bank) đạt mốc 100.000${CURRENCY}.`, type: 'check_balance', target: 100000 },
        { id: 'h19', name: "Cày Cấp Hardcore", desc: "Chăm chỉ cày cuốc, tăng thêm 1 Level nhân vật trong ngày.", type: 'levelup', target: 1 },
        { id: 'h20', name: "Nâng Cấp Thú", desc: "Đưa thú cưng lên tầm cao mới, nâng 1 thú lên Level 10.", type: 'pet_lv10', target: 10 },
        { id: 'h21', name: "Thương Buôn Đá Quý", desc: "Giao dịch lớn, bán thành công 1 viên Thiên Châu hoặc Huyền Bích.", type: 'sell_gem_vip', target: 1 },
        { id: 'h22', name: "Sát Thủ Tình Trường", desc: "Quyến rũ tuyệt đối, thực hiện .slut thành công 10 lần liên tiếp.", type: 'slut_streak', target: 10 },
        { id: 'h23', name: "Xì Dách Cược Lớn", desc: `Bản lĩnh đàn ông, thắng 2 ván Xì Dách khi đặt cược Max Bet (${GAME_CONFIG.maxBetXiDach.toLocaleString('vi-VN')}${CURRENCY}).`, type: 'xidach_max_bet', target: 2 },
        { id: 'h24', name: "Đá Gà Sống Còn", desc: `Khô máu, thắng 2 ván Đá Gà khi đặt cược Max Bet (${GAME_CONFIG.maxBetDaGa.toLocaleString('vi-VN')}${CURRENCY}).`, type: 'chicken_max_bet', target: 2 },
        { id: 'h25', name: "Bầu Cua Tất Tay", desc: `Chơi tới bến, thắng 2 ván Bầu Cua khi đặt cược Max Bet (${GAME_CONFIG.maxBetBauCua.toLocaleString('vi-VN')}${CURRENCY}).`, type: 'baucua_max_bet', target: 2 },
        { id: 'h26', name: "Vận May Kỳ Bí", desc: "Nhân phẩm cực hạn, nhặt được 2 Legend Crate khi đi Hunt (Không tính mua).", type: 'drop_legend_crate', target: 2 },
        { id: 'h27', name: "Uno: Wild Card", desc: "Thắng UNO bằng cách đánh lá bài cuối cùng là Đổi Màu (Wild) hoặc +4.", type: 'uno_wild_win', target: 1 },
        { id: 'h28', name: "Hoàn Thành Xuất Sắc", desc: "Siêu nhân nhiệm vụ, hoàn thành tất cả nhiệm vụ Dễ và Trung Bình trong ngày.", type: 'meta_quest', target: 1 },
        { id: 'h29', name: "Siêu Đạo Chích", desc: "Bàn tay nhám, Rob thành công 3 lần trong ngày.", type: 'rob_win', target: 3 },
    ]
};

function getTodayDate() {
    return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().split('T')[0];
}

function getRandomRound(min, max) {
    const minK = min / 1000;
    const maxK = max / 1000;
    const randK = Math.floor(Math.random() * (maxK - minK + 1)) + minK;
    return randK * 1000;
}

function generateReward(difficulty) {
    const isMoney = Math.random() < 0.5;
    let rewardData = { type: '', value: 0, itemId: '', display: '' };

    if (difficulty === 'EASY') {
        if (isMoney) {
            const amount = getRandomRound(1000, 2000);
            rewardData = { type: 'money', value: amount, display: `+ ${amount.toLocaleString('vi-VN')} ${CURRENCY}` };
        } else {
            const amount = Math.floor(Math.random() * (5 - 2 + 1)) + 2; 
            const itemKey = Math.random() < 0.5 ? 'lootbox' : 'crate';
            const itemIcon = SHOP_ITEMS[itemKey].emoji;
            const itemName = SHOP_ITEMS[itemKey].name;
            rewardData = { type: 'item', value: amount, itemId: itemKey, display: `+ ${amount} ${itemIcon} ${itemName}` };
        }
    } 
    else if (difficulty === 'MEDIUM') {
        if (isMoney) {
            const amount = getRandomRound(2000, 5000);
            rewardData = { type: 'money', value: amount, display: `+ ${amount.toLocaleString('vi-VN')} ${CURRENCY}` };
        } else {
            const amount = Math.floor(Math.random() * (10 - 5 + 1)) + 5; 
            const itemKey = Math.random() < 0.5 ? 'lootbox' : 'crate';
            const itemIcon = SHOP_ITEMS[itemKey].emoji;
            const itemName = SHOP_ITEMS[itemKey].name;
            rewardData = { type: 'item', value: amount, itemId: itemKey, display: `+ ${amount} ${itemIcon} ${itemName}` };
        }
    }
    else if (difficulty === 'HARD') {
        if (isMoney) {
            const amount = getRandomRound(5000, 7000);
            rewardData = { type: 'money', value: amount, display: `+ ${amount.toLocaleString('vi-VN')} ${CURRENCY}` };
        } else {
            const amount = Math.floor(Math.random() * (25 - 15 + 1)) + 15; 
            const itemKey = Math.random() < 0.5 ? 'lootbox' : 'crate';
            const itemIcon = SHOP_ITEMS[itemKey].emoji;
            const itemName = SHOP_ITEMS[itemKey].name;
            rewardData = { type: 'item', value: amount, itemId: itemKey, display: `+ ${amount} ${itemIcon} ${itemName}` };
        }
    }

    return rewardData;
}

function pickRandomMission(pool, history, excludeCurrent = []) {
    let available = pool.filter(m => !history.includes(m.id) && !excludeCurrent.includes(m.id));
    if (available.length === 0) {
        available = pool.filter(m => !excludeCurrent.includes(m.id));
    }
    if (available.length === 0) {
        available = pool;
    }
    const randomIndex = Math.floor(Math.random() * available.length);
    return available[randomIndex];
}


async function getUserMissions(userId) {
    let user = await economy.getUser(userId);
    const today = getTodayDate();

    if (!user.missions) {
        user.missions = { last_date: '', active: [], history: [], reset_count: 0 };
    }

    if (user.missions.reset_count === undefined) user.missions.reset_count = 0;

    if (user.missions.active && user.missions.active.length > 0) {
        let needUpdate = false;
        user.missions.active.forEach(m => {
            if (!m.rewardData || !m.rewardData.display) {
                let diff = 'EASY';
                if (m.id.startsWith('m')) diff = 'MEDIUM';
                if (m.id.startsWith('h')) diff = 'HARD';
                m.rewardData = generateReward(diff);
                needUpdate = true;
            }
        });
        if (needUpdate) {
            await economy.updateUserMissions(userId, user.missions);
        }
    }

    if (user.missions.last_date !== today) {
        let newHistory = [...user.missions.history];
        if (newHistory.length > 50) newHistory = []; 

        const easyM = pickRandomMission(MISSION_DATA.EASY, newHistory);
        const mediumM = pickRandomMission(MISSION_DATA.MEDIUM, newHistory);
        const hardM = pickRandomMission(MISSION_DATA.HARD, newHistory);

        if(easyM) newHistory.push(easyM.id);
        if(mediumM) newHistory.push(mediumM.id);
        if(hardM) newHistory.push(hardM.id);

        const rewardEasy = generateReward('EASY');
        const rewardMed = generateReward('MEDIUM');
        const rewardHard = generateReward('HARD');

        user.missions = {
            last_date: today,
            history: newHistory,
            reset_count: 0,
            active: [
                { ...easyM, progress: 0, completed: false, level: 'Dễ', rewardData: rewardEasy },
                { ...mediumM, progress: 0, completed: false, level: 'TB', rewardData: rewardMed },
                { ...hardM, progress: 0, completed: false, level: 'Khó', rewardData: rewardHard }
            ]
        };
        
        await economy.updateUserMissions(userId, user.missions);
    }

    return user.missions;
}


async function rerollMissions(userId) {
    const userMissions = await getUserMissions(userId);
    const resetCount = userMissions.reset_count || 0;
    const price = 2500 + (resetCount * 1000);

    const userBal = await economy.getBalance(userId);
    if (userBal.cash < price) {
        return { success: false, message: `Bạn không đủ tiền! Cần **${price.toLocaleString('vi-VN')}** ${CURRENCY} để làm mới.` };
    }

    await economy.subtractMoney(userId, price, "Reset Mission");

    const currentIDs = userMissions.active.map(m => m.id);
    let newHistory = userMissions.history;

    const easyM = pickRandomMission(MISSION_DATA.EASY, newHistory, currentIDs);
    const mediumM = pickRandomMission(MISSION_DATA.MEDIUM, newHistory, currentIDs);
    const hardM = pickRandomMission(MISSION_DATA.HARD, newHistory, currentIDs);

    if(easyM) newHistory.push(easyM.id);
    if(mediumM) newHistory.push(mediumM.id);
    if(hardM) newHistory.push(hardM.id);
    
    if (newHistory.length > 60) newHistory = newHistory.slice(newHistory.length - 60);

    const rewardEasy = generateReward('EASY');
    const rewardMed = generateReward('MEDIUM');
    const rewardHard = generateReward('HARD');

    userMissions.reset_count = resetCount + 1;
    userMissions.history = newHistory;
    userMissions.active = [
        { ...easyM, progress: 0, completed: false, level: 'Dễ', rewardData: rewardEasy },
        { ...mediumM, progress: 0, completed: false, level: 'TB', rewardData: rewardMed },
        { ...hardM, progress: 0, completed: false, level: 'Khó', rewardData: rewardHard }
    ];

    await economy.updateUserMissions(userId, userMissions);
    
    return { success: true, missions: userMissions };
}

function createMissionEmbed(user, missions) {
    let desc = "";
    
    missions.active.forEach((m, index) => {
        const percent = Math.min(100, Math.floor((m.progress / m.target) * 100));
        const strikeThrough = m.completed ? "~~" : "";
        const statusLabel = m.completed ? "[Hoàn thành]" : `[${index + 1}]`;

        desc += `**${statusLabel} ${m.name} (${m.level})**\n`;
        desc += `${strikeThrough}${m.desc}${strikeThrough}\n`;
        desc += `Tiến độ: \`${m.progress}/${m.target}\` (${percent}%)\n`;
        
        if (m.completed) {
            desc += `Thưởng: *Đã nhận thưởng*\n\n`; 
        } else if (m.rewardData && m.rewardData.display) {
            desc += `Thưởng: ${m.rewardData.display}\n\n`;
        } else {
            desc += `Thưởng: Phần thưởng bí mật\n\n`;
        }
    });

    const embed = new EmbedBuilder()
        .setTitle(`📜 Nhiệm Vụ Hằng Ngày - ${user.username}`)
        .setColor('Gold')
        .setDescription(desc)
        .setFooter({ text: "Nhiệm vụ tự động reset vào 00:00 mỗi ngày" })
        .setTimestamp();
        
    return embed;
}

async function handleMissionCommand(message) {
    const userId = message.author.id;
    try {
        const battleProfile = await BattleProfile.findOne({ user_id: userId });
        if (battleProfile && battleProfile.team && battleProfile.team.length > 0) {
            
            let maxLevel = 0;
            for (const pet of battleProfile.team) {
                if (pet.level > maxLevel) maxLevel = pet.level;
            }

            
            if (maxLevel >= 5) {
                await updateMissionProgress(userId, 'team_lv5', 1);
            }
            
            if (maxLevel >= 10) {
                await updateMissionProgress(userId, 'pet_lv10', 10);
            }
        }
    } catch (e) {
        console.error("Lỗi check nhiệm vụ level thú:", e);
    }
    let missions = await getUserMissions(userId);
    
    const renderMessage = () => {
        const embed = createMissionEmbed(message.author, missions);
        const resetCount = missions.reset_count || 0;
        const maxResets = 5;
        const price = 2500 + (resetCount * 1000);
        
        const rows = [];
        
        if (resetCount < maxResets) {
            const btn = new ButtonBuilder()
                .setCustomId('mission_reset')
                
                .setLabel(`Làm mới (${price.toLocaleString('vi-VN')} ${CURRENCY})`)
                .setStyle(ButtonStyle.Primary);
                
            rows.push(new ActionRowBuilder().addComponents(btn));
        }
        
        return { embeds: [embed], components: rows };
    };

    const msg = await message.channel.send(renderMessage());

    const collector = msg.createMessageComponentCollector({ 
        componentType: ComponentType.Button, 
        time: 60000 
    });

    collector.on('collect', async i => {
        if (i.user.id !== userId) {
            return i.reply({ content: "🚫 Đây không phải nhiệm vụ của bạn!", ephemeral: true });
        }

        if (i.customId === 'mission_reset') {
            await i.deferUpdate();
            
            const result = await rerollMissions(userId);
            
            if (result.success) {
                missions = result.missions;
                await msg.edit(renderMessage());
            } else {
                const failMsg = await i.followUp({ content: `❌ ${result.message}`, ephemeral: true });
                setTimeout(() => failMsg.delete().catch(()=>{}), 3000);
            }
        }
    });

    collector.on('end', () => {
        const disabledRow = new ActionRowBuilder();
        if (msg.components && msg.components.length > 0) {
            msg.components[0].components.forEach(c => {
                const btn = ButtonBuilder.from(c).setDisabled(true);
                disabledRow.addComponents(btn);
            });
            msg.edit({ components: [disabledRow] }).catch(() => {});
        }
    });
}


async function updateMissionProgress(userId, type, amount = 1, isStreakReset = false) {
    const user = await economy.getUser(userId);
    if (!user.missions || user.missions.active.length === 0) return;
    if (user.missions.last_date !== getTodayDate()) return;

    let updated = false;
    let completedName = "";

    for (let i = 0; i < user.missions.active.length; i++) {
        let m = user.missions.active[i];
        if (m.completed) continue;

        if (m.type === type) {
            if (type.includes('streak')) {
                if (isStreakReset) {
                    m.progress = 0;
                    updated = true;
                } else {
                    m.progress += amount;
                    updated = true;
                }
            } else {
                m.progress += amount;
                updated = true;
            }

            if (m.progress >= m.target) {
                m.progress = m.target;
                m.completed = true;
                completedName = m.name;
                
                
                if (m.rewardData && m.rewardData.type === 'money') {
                    await economy.addMoney(userId, m.rewardData.value, `Quest: ${m.name}`);
                } else if (m.rewardData && m.rewardData.type === 'item') {
                    await economy.addItem(userId, m.rewardData.itemId, m.rewardData.value);
                }
                
                updated = true;
            }
        }
    }

    if (updated) {
        const easyDone = user.missions.active[0].completed;
        const mediumDone = user.missions.active[1].completed;
        const hardQuest = user.missions.active[2];
        
        if (easyDone && mediumDone && hardQuest.type === 'meta_quest' && !hardQuest.completed) {
            hardQuest.progress = 1;
            hardQuest.completed = true;
            
            if (hardQuest.rewardData && hardQuest.rewardData.type === 'money') {
                await economy.addMoney(userId, hardQuest.rewardData.value, `Meta Quest`);
            } else if (hardQuest.rewardData && hardQuest.rewardData.type === 'item') {
                await economy.addItem(userId, hardQuest.rewardData.itemId, hardQuest.rewardData.value);
            }
            
            completedName += ` & ${hardQuest.name}`;
        }

        await economy.updateUserMissions(userId, user.missions);
    }
}

module.exports = { 
    handleMissionCommand, 
    updateMissionProgress,
    getUserMissions
};