import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection, EmbedBuilder, ModalSubmitInteraction, PermissionFlagsBits, StringSelectMenuInteraction, TextInputComponent } from "discord.js";
import { DiscordClient } from "../Types";
import {TicketType} from "../Types";
import { log } from "./logs";

/*
Copyright 2023 Sayrix (github.com/Sayrix)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/**
 * @param {Discord.Interaction} interaction
 * @param {Discord.Client} client
 * @param {Object} ticketType
 * @param {Object|string} reasons
 */
export const createTicket = async (interaction: StringSelectMenuInteraction | ModalSubmitInteraction, client: DiscordClient, ticketType: TicketType, reasons?: Collection<string, TextInputComponent> | string) => {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise(async function (resolve, reject) {
		await interaction.deferReply({ ephemeral: true }).catch((e) => console.log(e));

		const reason: string[] = [];
		let allReasons = "";

		if (typeof reasons === "object") {
			reasons.forEach(async (r) => {
				reason.push(r.value);
			});
			allReasons = reason.map((r, i) => `Question ${i + 1}: ${r}`).join(", ");
		}
		if(typeof reasons === "string") allReasons = reasons;

		let ticketName = "";

		let ticketCount = (await client.prisma.$queryRaw<[{count: bigint}]>
		`SELECT COUNT(*) as count FROM tickets`)[0].count;

		if (ticketType.ticketNameOption) {
			ticketName = ticketType.ticketNameOption
				.replace("USERNAME", interaction.user.username)
				.replace("USERID", interaction.user.id)
				.replace("TICKETCOUNT", ticketCount.toString() ?? "0");
		} else {
			ticketName = client.config.ticketNameOption
				.replace("USERNAME", interaction.user.username)
				.replace("USERID", interaction.user.id)
				.replace("TICKETCOUNT", ticketCount.toString() ?? "0");
		}
		if(!interaction.guild) return console.error("Interaction createTicket was not executed in a guild");
		
		const channel = await client.guilds.cache.get(client.config.guildId)?.channels.create({
			name: ticketName,
			parent: ticketType.categoryId,
			permissionOverwrites: [
				{
					id: interaction.guild.roles.everyone,
					deny: [PermissionFlagsBits.ViewChannel],
				},
			],
		});

		if (!channel) return reject("Couldn't create the ticket channel.");
		log(
			{
				LogType: "ticketCreate",
				user: interaction.user,
				reason: allReasons,
				ticketChannelId: channel.id
			},
			client
		);

		// Client.db is set here and incremented ticket count
		ticketCount++;

		channel.permissionOverwrites
			.edit(interaction.user, {
				SendMessages: true,
				AddReactions: true,
				ReadMessageHistory: true,
				AttachFiles: true,
				ViewChannel: true,
			})
			.catch((e) => console.log(e));

		if (client.config.rolesWhoHaveAccessToTheTickets.length > 0) {
			client.config.rolesWhoHaveAccessToTheTickets.forEach(async (role) => {
				channel.permissionOverwrites
					.edit(role, {
						SendMessages: true,
						AddReactions: true,
						ReadMessageHistory: true,
						AttachFiles: true,
						ViewChannel: true,
					})
					.catch((e) => console.log(e));
			});
		}
		const lEmbeds = client.locales.embeds;
		const footer = lEmbeds.ticketOpened.footer.text.replace("ticket.pm", "");
		if(ticketType.color?.toString().trim() === "") ticketType.color = undefined;
		const ticketOpenedEmbed = new EmbedBuilder({
			...lEmbeds.ticketOpened,
			color: 0,
		})
			.setColor(ticketType.color ?? client.config.mainColor)
			.setTitle(lEmbeds.ticketOpened.title.replace("CATEGORYNAME", ticketType.name))
			.setDescription(
				ticketType.customDescription
					? ticketType.customDescription
						.replace("CATEGORYNAME", ticketType.name)
						.replace("USERNAME", interaction.user.username)
						.replace("USERID", interaction.user.id)
						.replace("TICKETCOUNT", ticketCount.toString() || "0")
						.replace("REASON1", reason[0])
						.replace("REASON2", reason[1])
						.replace("REASON3", reason[2])
						.replace("REASON4", reason[3])
						.replace("REASON5", reason[4])
						.replace("REASON6", reason[5])
						.replace("REASON7", reason[6])
						.replace("REASON8", reason[7])
						.replace("REASON9", reason[8])
					: lEmbeds.ticketOpened.description
						.replace("CATEGORYNAME", ticketType.name)
						.replace("USERNAME", interaction.user.username)
						.replace("USERID", interaction.user.id)
						.replace("TICKETCOUNT", ticketCount.toString() || "0")
						.replace("REASON1", reason[0])
						.replace("REASON2", reason[1])
						.replace("REASON3", reason[2])
						.replace("REASON4", reason[3])
						.replace("REASON5", reason[4])
						.replace("REASON6", reason[5])
						.replace("REASON7", reason[6])
						.replace("REASON8", reason[7])
						.replace("REASON9", reason[8])
			)
			.setFooter({
				// Please respect the project by keeping the credits, (if it is too disturbing you can credit me in the "about me" of the bot discord)
				text: `ticket.pm ${footer.trim() !== "" ? `- ${footer}` : ""}`, // Please respect the LICENSE :D
				// Please respect the project by keeping the credits, (if it is too disturbing you can credit me in the "about me" of the bot discord)
				iconURL: lEmbeds.ticketOpened.footer.iconUrl
			});

		const row = new ActionRowBuilder<ButtonBuilder>();

		if (client.config.closeOption.closeButton) {
			if (client.config.closeOption.askReason) {
				row.addComponents(
					new ButtonBuilder()
						.setCustomId("close_askReason")
						.setLabel(client.locales.buttons.close.label)
						.setEmoji(client.locales.buttons.close.emoji)
						.setStyle(ButtonStyle.Danger)
				);
			} else {
				row.addComponents(
					new ButtonBuilder()
						.setCustomId("close")
						.setLabel(client.locales.buttons.close.label)
						.setEmoji(client.locales.buttons.close.emoji)
						.setStyle(ButtonStyle.Danger)
				);
			}
		}

		if (client.config.claimOption.claimButton) {
			row.addComponents(
				new ButtonBuilder()
					.setCustomId("claim")
					.setLabel(client.locales.buttons.claim.label)
					.setEmoji(client.locales.buttons.claim.emoji)
					.setStyle(ButtonStyle.Primary)
			);
		}

		const body = {
			embeds: [ticketOpenedEmbed],
			content: `<@${interaction.user.id}> ${
				client.config.pingRoleWhenOpened ? client.config.roleToPingWhenOpenedId.map((x) => `<@&${x}>`).join(", ") : ""
			}`,
			components: [] as ActionRowBuilder<ButtonBuilder>[],
		};

		if (row.components.length > 0) body.components = [row];

		channel
			.send(body)
			.then((msg) => {
				client.prisma.tickets.create({
					data: {
						category: JSON.stringify(ticketType),
						reason: allReasons,
						creator: interaction.user.id,
						createdat: Date.now(),
						channelid: channel.id,
						messageid: msg.id
					}
				}).then(); // Again why tf do I need .then()?!?!?
				msg.pin().then(() => {
					msg.channel.bulkDelete(1);
				});
				interaction
					.editReply({
						content: client.locales.ticketOpenedMessage.replace("TICKETCHANNEL", `<#${channel.id}>`),
						components: [],

					})
					.catch((e) => console.log(e));

				resolve(true);
			})
			.catch((e) => console.log(e));
	});
};
