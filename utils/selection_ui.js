const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

/**
 * Hiển thị bảng xác nhận chọn vật phẩm/thú khi có nhiều kết quả trùng khớp
 */
async function showSelectionMenu(message, items, actionType, callback) {
    const userId = message.author.id;

    
    const displayItems = items.slice(0, 25); 
    
    let description = items.length > 1 
        ? `Tìm thấy **${items.length}** kết quả trùng khớp.\nVui lòng chọn chính xác thứ bạn muốn **${actionType === 'use' ? 'Sử Dụng' : 'Bán'}**:`
        : `Xác nhận thao tác với:`;

    const itemListText = displayItems.map((item, index) => {
        const typeLabel = item.type === 'animal' ? '[Thú]' : '[Item]';
        return `**${index + 1}.** ${item.emoji} **${item.name}** \`${typeLabel}\``;
    }).join('\n');

    const embed = new EmbedBuilder()
        .setColor('Orange')
        .setTitle(`XÁC NHẬN ${actionType.toUpperCase()} ITEM`)
        .setDescription(`${description}\n\n${itemListText}\n\n*Bấm nút bên dưới để chọn.*`)
        .setFooter({ text: "Lựa chọn sẽ hết hạn sau 30 giây." });

    const rows = [];
    let currentRow = new ActionRowBuilder();

    displayItems.forEach((item, index) => {
        if (index > 0 && index % 5 === 0) {
            rows.push(currentRow);
            currentRow = new ActionRowBuilder();
        }
        currentRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`select_item_${index}`)
                .setLabel(`${index + 1}. ${item.name}`.substring(0, 80))
                .setEmoji(item.emoji)
                .setStyle(ButtonStyle.Secondary)
        );
    });
    if (currentRow.components.length > 0) rows.push(currentRow);

    const cancelRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('select_cancel').setLabel('Hủy Bỏ').setStyle(ButtonStyle.Danger)
    );
    rows.push(cancelRow);

    const replyMsg = await message.reply({ embeds: [embed], components: rows });

    const collector = replyMsg.createMessageComponentCollector({ 
        componentType: ComponentType.Button, 
        time: 30000,
        filter: i => i.user.id === userId 
    });

    collector.on('collect', async interaction => {
        if (interaction.customId === 'select_cancel') {
            await interaction.update({ content: "Đã hủy thao tác.", embeds: [], components: [] });
            return;
        }

        if (interaction.customId.startsWith('select_item_')) {
            const index = parseInt(interaction.customId.replace('select_item_', ''));
            const selectedItem = displayItems[index];

            if (callback) callback(selectedItem, interaction);
        }
    });

    collector.on('end', (collected, reason) => {
        if (reason === 'time') {
            replyMsg.edit({ content: "Đã hết thời gian lựa chọn.", embeds: [], components: [] }).catch(() => {});
        }
    });
}

/**
 * Hiển thị bảng chọn User khi tìm thấy nhiều người trùng tên
 */
async function showUserSelection(message, users) {
    const authorId = message.author.id;
    const candidates = users.slice(0, 5);

    let description = `Tìm thấy **${users.length}** người dùng phù hợp.\nVui lòng chọn người bạn muốn thao tác:\n\n`;
    
    candidates.forEach((user, index) => {
        const name = user.globalName || user.username;
        description += `**${index + 1}.** ${user.toString()} \`(${user.username})\`\nID: \`${user.id}\`\n`;
    });

    const embed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('XÁC NHẬN NGƯỜI DÙNG')
        .setDescription(description)
        .setThumbnail(candidates[0].displayAvatarURL())
        .setFooter({ text: "Chọn số tương ứng bên dưới. Hết hạn sau 30s." });

    const rows = [];
    
    let userRow = new ActionRowBuilder();
    candidates.forEach((user, index) => {
        const name = user.globalName || user.username;
        userRow.addComponents(
            new ButtonBuilder()
                .setCustomId(`sel_user_${index}`)
                .setLabel(`${index + 1}. ${name}`.substring(0, 80))
                .setStyle(ButtonStyle.Primary)
        );
    });
    rows.push(userRow);
    
    const cancelRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('sel_user_cancel')
            .setLabel('Hủy Bỏ')
            .setStyle(ButtonStyle.Danger)
    );
    rows.push(cancelRow);

    const replyMsg = await message.reply({ embeds: [embed], components: rows });

    try {
        const filter = i => i.user.id === authorId && i.customId.startsWith('sel_user_');
        const interaction = await replyMsg.awaitMessageComponent({ filter, time: 30000 });

        if (interaction.customId === 'sel_user_cancel') {
            await interaction.update({ content: "Đã hủy chọn người dùng.", embeds: [], components: [] });
            return null;
        }

        const selectedIndex = parseInt(interaction.customId.split('_')[2]);
        const selectedUser = candidates[selectedIndex];

        await interaction.update({ content: `Đã chọn: **${selectedUser.username}**`, embeds: [], components: [] });
        
        setTimeout(() => replyMsg.delete().catch(() => {}), 2000);

        return selectedUser;

    } catch (e) {
        await replyMsg.edit({ content: "Hết thời gian lựa chọn.", embeds: [], components: [] }).catch(() => {});
        return null;
    }
}

module.exports = { showSelectionMenu, showUserSelection };