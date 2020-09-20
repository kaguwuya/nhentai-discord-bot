import Command from '@nhentai/struct/bot/Command';
import Inhibitor from '@nhentai/struct/bot/Inhibitor';
import { Message, DMChannel } from 'discord.js';

export default class extends Inhibitor {
    constructor() {
        super('nsfw', {
            reason: 'nsfw',
        });
    }

    exec(message: Message, command: Command) {
        // bypass check for DM
        if (message.channel instanceof DMChannel) return false;
        let ok =
            !message.channel.nsfw &&
            (command.categoryID == 'general' || command.categoryID == 'images');
        if (ok)
            message.channel.send(
                this.client.embeds.clientError('🔞 This command cannot be run in a SFW channel.')
            );
        return ok;
    }
}