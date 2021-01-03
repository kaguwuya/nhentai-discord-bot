import { Command } from '@structures/Command';
import { Message } from 'discord.js';
import { Server } from '@models/server';

export default class extends Command {
    constructor() {
        super('leaderboard', {
            aliases: ['leaderboard', 'top'],
            channel: 'guild',
            description: {
                content: "Views server's leaderboard",
            },
        });
    }

    async exec(message: Message) {
        try {
            const server = await Server.findOne({ serverID: message.guild.id }).exec();
            const pervs = Array.from(server.users, ([userID, user]) => ({
                id: userID,
                points: user.points,
                level: user.level,
            }));
            pervs.sort((a, b) => b.points - a.points);
            const pos = pervs.findIndex(x => x.id == message.author.id);
            if (!pervs.length)
                return message.channel.send(
                    this.client.util
                        .embed()
                        .setTitle(`${message.guild.name}'s leaderboard`)
                        .setThumbnail(message.guild.iconURL())
                        .setDescription('Looks like nobody has any points. *cricket noises')
                );
            const list = this.client.embeds
                .richMenu({
                    template: this.client.util
                        .embed()
                        .setTitle(`${message.guild.name}'s leaderboard`)
                        .setThumbnail(message.guild.iconURL())
                        .setFooter(
                            `Your guild placing stats : Rank [${pos + 1}]\u2000•\u2000Level : ${
                                pervs[pos].level
                            }\u2000•\u2000Total Score : ${pervs[pos].points}`
                        ),
                    list: 10,
                })
                .useCustomFooters();
            pervs.forEach(async perv => {
                let level = `**Level** : ${perv.level}`,
                    score = `**Total Score** : ${perv.points}`;
                if (perv === pervs[pos]) (level = `__${level}__`), (score = `__${score}__`);
                list.addChoice(
                    0,
                    `${(await this.client.users.fetch(perv.id)).tag}`,
                    `${level}\u2000•\u2000${score}`
                );
            });
            return list.run(
                this.client,
                message,
                await message.channel.send('Loading leaderboard ...'),
                '',
                {
                    time: 180000,
                }
            );
        } catch (err) {
            this.client.logger.error(err);
            return message.channel.send(this.client.embeds.internalError(err));
        }
    }
}
