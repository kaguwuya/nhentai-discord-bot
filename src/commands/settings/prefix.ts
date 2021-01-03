import { Command } from '@structures/Command';
import { Message } from 'discord.js';

const MAX_LEN = 100;
const REQUIRED_PERMISSIONS = ['MANAGE_GUILD'] as const;

const ACTIONS = {
    add: 'Added',
    remove: 'Removed',
    clear: 'Cleared',
    list: 'List',
};

export default class extends Command {
    constructor() {
        super('prefix', {
            aliases: ['prefix'],
            channel: 'guild',
            userPermissions: REQUIRED_PERMISSIONS,
            description: {
                content: "Edits server's custom prefix list.",
                usage: '<nsfw|sfw> <add <prefix>|remove <prefix>|clear|list>',
                examples: ['nsfw add lmao', 'sfw remove lol', 'nsfw clear', 'sfw list'],
            },
            args: [
                {
                    id: 'nsfw',
                    type: ['nsfw', 'sfw'],
                },
                {
                    id: 'action',
                    type: Object.keys(ACTIONS),
                },
                {
                    id: 'prefix',
                    match: 'rest',
                },
            ],
        });
    }

    async exec(
        message: Message,
        {
            nsfw,
            action,
            prefix,
        }: { nsfw: 'nsfw' | 'sfw'; action: keyof typeof ACTIONS; prefix: string }
    ) {
        if (!nsfw)
            return message.channel.send(
                this.client.embeds.clientError(
                    `Unknown type. Available types are: \`nsfw\`, \`sfw\``
                )
            );
        if (!action)
            return message.channel.send(
                this.client.embeds.clientError(
                    `Unknown action. Available actions are: ${Object.keys(ACTIONS)
                        .map(x => `\`${x}\``)
                        .join(', ')}`
                )
            );
        if ((!prefix || prefix.length > MAX_LEN) && action !== 'list' && action !== 'clear')
            return message.channel.send(
                this.client.embeds.clientError(`Prefix length must be between 1 and ${MAX_LEN}!`)
            );
        try {
            const prefixes = await this.client.db.Server.prefix(message, nsfw, action, prefix);
            if (action == 'add' || action == 'remove') {
                await this.client.commandHandler.updatePrefix(message);
                return message.channel.send(
                    this.client.embeds.info(`${ACTIONS[action]} prefix \`${prefix}\`.`)
                );
            } else if (action === 'clear') {
                await this.client.commandHandler.updatePrefix(message);
                return message.channel.send(this.client.embeds.info('Cleared all prefixes.'));
            } else if (!prefixes.length) {
                return message.channel.send(
                    this.client.embeds.info(
                        'This server has no custom prefixes. Ask someone with `Manage Server` permission to add one.'
                    )
                );
            }
            const list = this.client.embeds.richMenu({
                template: this.client.util
                    .embed()
                    .setTitle('Custom Prefix List')
                    .setDescription(
                        `You can still use the default prefix ${this.client.config.settings.prefix[nsfw]}.`
                    ),
                list: 5,
            });
            prefixes.forEach(async pfx => {
                list.addChoice(
                    0,
                    pfx.id,
                    `**Added by** : ${
                        (await this.client.users.fetch(pfx.author)).tag
                    }\u2000•\u2000**Date added** : ${new Date(pfx.date).toUTCString()}`
                );
            });
            return list.run(this.client, message, await message.channel.send('Fetching list...'));
        } catch (err) {
            this.client.logger.error(err);
            return message.channel.send(this.client.embeds.internalError(err));
        }
    }
}
