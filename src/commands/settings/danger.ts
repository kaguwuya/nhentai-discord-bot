import { Command } from '@structures/Command';
import { Message } from 'discord.js';

const REQUIRED_PERMISSIONS = ['MANAGE_GUILD'] as const;

export default class extends Command {
    constructor() {
        super('danger', {
            aliases: ['danger', 'fucktos', 'toggle-danger'],
            channel: 'guild',
            userPermissions: REQUIRED_PERMISSIONS,
            description: {
                content:
                    'Toggles danger mode (allowing contents involving lolicon, shotacon, gore, etc.)',
            },
        });
    }

    async exec(message: Message) {
        try {
            const danger = await this.client.db.Server.danger(message);
            return message.channel.send(
                this.client.embeds.info(
                    `Turned ${danger ? 'on' : 'off'} danger mode for this server.`
                )
            );
        } catch (err) {
            this.client.logger.error(err);
            return message.channel.send(this.client.embeds.internalError(err));
        }
    }
}
