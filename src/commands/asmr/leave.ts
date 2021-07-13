import { Client, Command } from '@structures';
import { CommandInteraction } from 'discord.js';

export default class extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'leave',
            description: 'Leaves the voice channel',
            cooldown: 10000,
        });
    }

    async exec(interaction: CommandInteraction) {
        const subscription = this.client.subscriptions.get(interaction.guildId);
        if (subscription) {
            subscription.voiceConnection.destroy();
            this.client.subscriptions.delete(interaction.guildId);
            return interaction.editReply(`📭\u2000Disconnected from voice channel`);
        }
        return interaction.editReply("❌\u2000Nothing's playing in this server!");
    }
}
