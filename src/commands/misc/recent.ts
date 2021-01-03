import { Command } from '@structures/Command';
import { Message } from 'discord.js';
import moment from 'moment';
import { Server } from '@models/server';

export default class extends Command {
    constructor() {
        super('recent', {
            aliases: ['recent'],
            channel: 'guild',
            nsfw: true,
            description: {
                content: "Stalking people's fetishes.",
            },
        });
    }

    async exec(message: Message) {
        try {
            const server = await Server.findOne({
                serverID: message.guild.id,
            }).exec();
            if (!server)
                return message.channel.send(
                    this.client.embeds.info('There are no recent calls in this server.')
                );
            else {
                if (!server.recent.length)
                    return message.channel.send(
                        this.client.embeds.info('There are no recent calls in this server.')
                    );
                let recent = server.recent.reverse().slice(0, 5);
                let _ = await Promise.all(
                    recent.map(async x => {
                        return `${(await this.client.users.fetch(x.author)).tag} : **\`${
                            x.id
                        }\`** \`${x.name}\` (${moment(x.date).fromNow()})`;
                    })
                );
                return message.channel.send(this.client.embeds.info(_.join('\n')));
            }
        } catch (err) {
            this.client.logger.error(err);
            return message.channel.send(this.client.embeds.internalError(err));
        }
    }
}
