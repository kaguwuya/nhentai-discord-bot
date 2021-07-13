import { Client, Command } from '@structures';
import { CommandInteraction } from 'discord.js';
import { WatchModel } from '@database/models';

export default class extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'follow',
            description: 'Shows your follow list',
            cooldown: 10000,
            nsfw: true,
        });
    }

    async exec(interaction: CommandInteraction) {
        const member = interaction.user;
        const tags = await WatchModel.find({ user: member.id }).exec();
        if (!tags) {
            return interaction.editReply({
                embeds: [
                    this.client.embeds
                        .default()
                        .setTitle('🔖\u2000Follow List')
                        .setDescription("You haven't followed anything!")
                        .setFooter(member.tag, member.displayAvatarURL()),
                ],
            });
        }
        if (!tags.length) {
            return interaction.editReply({
                embeds: [
                    this.client.embeds
                        .default()
                        .setTitle('🔖\u2000Follow List')
                        .setDescription("You haven't followed anything!")
                        .setFooter(member.tag, member.displayAvatarURL()),
                ],
            });
        }
        let embed = this.client.embeds
            .default()
            .setTitle(`🔖\u2000Follow List`)
            .setFooter(member.tag, member.displayAvatarURL());
        let t = new Map<string, string[]>();
        tags.forEach(tag => {
            const { type, name } = tag;
            let a = t.get(type) || [];
            a.push(`\`${name}\``);
            t.set(type, a);
        });
        [
            ['parody', 'Parodies'],
            ['character', 'Characters'],
            ['tag', 'Tags'],
            ['artist', 'Artists'],
            ['group', 'Groups'],
            ['language', 'Languages'],
            ['category', 'Categories'],
        ].forEach(([key, fieldName]) => {
            t.has(key) && embed.addField(fieldName, t.get(key).join(', '));
        });
        return interaction.editReply({ embeds: [embed] });
    }
}
