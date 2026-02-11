const express = require('express');
const router = express.Router();
const economy = require('../../utils/economy');
const { getBaseHtml } = require('../utils/viewHelper');
const { requireLogin } = require('../middleware/authMiddleware');

module.exports = (client) => {
    
    router.get('/install-servers', requireLogin, (req, res) => {
        const guilds = client.guilds.cache.map(g => ({
            id: g.id, name: g.name,
            icon: g.iconURL() || 'https://cdn.discordapp.com/embed/avatars/0.png',
            count: g.memberCount
        }));
        let html = guilds.map(g => `
            <div class="col-md-3">
                <a href="/manage-server/${g.id}" class="text-decoration-none">
                    <div class="card h-100 border-0 p-3 text-center shadow-sm">
                        <img src="${g.icon}" class="rounded-circle mx-auto mb-2" width="60">
                        <div class="text-white fw-bold text-truncate">${g.name}</div>
                        <small class="text-muted">${g.count} Members</small>
                    </div>
                </a>
            </div>
        `).join('');
        res.send(getBaseHtml('Install Servers', `<h3 class="mb-4 fw-bold">🚀 Install Servers</h3><div class="row g-3">${html}</div>`, 'servers', req.session.user));
    });

    router.get('/manage-server/:id', requireLogin, async (req, res) => {
        const guild = client.guilds.cache.get(req.params.id);
        if(!guild) return res.redirect('/install-servers');
        
        const globalUsers = await economy.getAllUsers();

        const serverUsers = globalUsers
            .filter(u => guild.members.cache.has(u.user_id))
            .sort((a,b) => b.total - a.total);

        const topUsersHtml = serverUsers.slice(0, 15).map((u, i) => {
            let name = u.display_name || u.username;
            
            if (!name || name === 'Unknown') {
                const member = guild.members.cache.get(u.user_id);
                name = member ? (member.displayName || member.user.username) : `User ${u.user_id}`;
            }
            
            return `
                <tr>
                    <td class="ps-3">#${i+1}</td>
                    <td>${name}</td>
                    <td class="text-end pe-3">${u.total.toLocaleString('vi-VN')} 🪙</td>
                </tr>
            `;
        }).join('');

        const body = `
            <h3 class="mb-4 fw-bold">${guild.name}</h3>
            <div class="row">
                <div class="col-md-8">
                    <div class="card border-0">
                        <div class="card-header bg-dark">📋 Server Leaderboard (Top Users Active)</div>
                        <div class="card-body p-0">
                            <table class="table table-hover mb-0">
                                <thead><tr><th class="ps-3">Hạng</th><th>User</th><th class="text-end pe-3">Tài sản</th></tr></thead>
                                <tbody>
                                    ${topUsersHtml || '<tr><td colspan="3" class="text-center py-3">Chưa có dữ liệu người dùng trong server này.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card mb-4 border-0">
                        <div class="card-header bg-primary">🛡️ Server Admin System</div>
                        <div class="card-body">
                            <form action="/api/server/give" method="POST">
                                <input type="hidden" name="guildId" value="${guild.id}">
                                <label class="small">Đối tượng (ID User/Role)</label>
                                <input type="text" name="targetId" class="form-control mb-2" required placeholder="Nhập ID User">
                                <label class="small">Vật phẩm</label>
                                <select name="item" class="form-select mb-2">
                                    <option value="money">Tiền 🪙</option>
                                    <option value="lootbox">Lootbox (lb)</option>
                                    <option value="lootboxvip">LB VIP (lbvip)</option>
                                    <option value="crate">Nomal (nc)</option>
                                    <option value="crateL">Legend (lc)</option>
                                </select>
                                <label class="small">Số lượng</label>
                                <input type="number" name="amount" class="form-control mb-3" value="1">
                                <button class="btn btn-primary w-100">Cấp Phát</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
        res.send(getBaseHtml(guild.name, body, 'servers', req.session.user));
    });

    return router;
};