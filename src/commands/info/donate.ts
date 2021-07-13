import { Client, Command } from '@structures';
import { CommandInteraction, MessageActionRow, MessageButton } from 'discord.js';

export default class extends Command {
    constructor(client: Client) {
        super(client, {
            name: 'donate',
            description: "Show support to the bot's creator",
        });
    }

    exec(interaction: CommandInteraction) {
        return interaction.editReply({
            content:
                "If you really like me and want to support my creator, you can consider donating to my creator's Paypal. Do note that donating will not grant you any kinds of perks in return. Donating shows that the project is useful to you and you believe in the future of the project.",
            components: [
                new MessageActionRow().addComponents(
                    new MessageButton()
                        .setLabel('Paypal')
                        .setURL('https://paypal.me/taiyou67')
                        .setStyle('LINK')
                ),
            ],
        });
    }
}
