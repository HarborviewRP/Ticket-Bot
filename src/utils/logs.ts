import Discord, { ChannelType, TextChannel, User } from "discord.js";
import { DiscordClient } from "../Types";

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

type log = {
	LogType: "ticketCreate"
	user: User
	ticketChannelId?: string;
	reason?: string;
} | {
	LogType: "ticketClaim" | "ticketClose"
	user: User
	ticketChannelId?: string;
	ticketId?: string | number;
	reason?: string;
	ticketCreatedAt: number | bigint;
} | {
	LogType: "ticketDelete"
	user: User
	ticketChannelId?: string;
	ticketId?: string | number;
	reason?: string;
	ticketCreatedAt: number | bigint;
	transcriptURL?: string;

} | {
	LogType: "userAdded" | "userRemoved"
	user: User;
	target: {
		id?: string
	};
	ticketChannelId?: string;
	reason?: string;
	ticketId?: string | number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const log = async(logs: log, client: DiscordClient) => {
	if (!client.config.logs) return;
	if (!client.config.logsChannelId) return;
	const channel = await client.channels
		.fetch(client.config.logsChannelId)
		.catch((e) => console.error("The channel to log events is not found!\n", e));
	if (!channel) return console.error("The channel to log events is not found!");
	if (!channel.isTextBased() ||
		channel.type === ChannelType.DM ||
		channel.type === ChannelType.PrivateThread ||
		channel.type === ChannelType.PublicThread) return console.error("Invalid Channel!");

	const webhook = (await (channel as TextChannel).fetchWebhooks()).find((wh) => wh.token) ?? 
		await (channel as TextChannel).createWebhook({ name: "Ticket Bot Logs" });

	if (logs.LogType === "ticketCreate") {
		const embed = new Discord.EmbedBuilder()
			.setColor("#3ba55c")
			.setAuthor({ name: logs.user.tag, iconURL: logs.user.displayAvatarURL() })
			.setDescription(`${logs.user.tag} (<@${logs.user.id}>) Created a ticket (<#${logs.ticketChannelId}>) with the reason: \`${logs.reason}\``);

		webhook
			.send({
				username: "Ticket Created",
				avatarURL: "https://i.imgur.com/M38ZmjM.png",
				embeds: [embed],
			})
			.catch((e) => console.log(e));
	}
	if (logs.LogType === "ticketClaim") {
		const embed = new Discord.EmbedBuilder()
			.setColor("#faa61a")
			.setAuthor({ name: logs.user.tag, iconURL: logs.user.displayAvatarURL() })
			.setDescription(
				`${logs.user.tag} (<@${logs.user.id}>) Claimed the ticket n°${logs.ticketId} (<#${logs.ticketChannelId}>) after ${client.msToHm(
					new Date(Number(BigInt(Date.now()) - BigInt(logs.ticketCreatedAt)))
				)} of creation`
			);
		webhook
			.send({
				username: "Ticket Claimed",
				avatarURL: "https://i.imgur.com/qqEaUyR.png",
				embeds: [embed],
			})
			.catch((e) => console.log(e));
	}

	if (logs.LogType === "ticketClose") {
		const embed = new Discord.EmbedBuilder()
			.setColor("#ed4245")
			.setAuthor({ name: logs.user.tag, iconURL: logs.user.displayAvatarURL() })
			.setDescription(
				`${logs.user.tag} (<@${logs.user.id}>) Closed the ticket n°${logs.ticketId} (<#${logs.ticketChannelId}>) with the reason: \`${
					logs.reason
				}\` after ${client.msToHm(Number(BigInt(Date.now()) - BigInt(logs.ticketCreatedAt)))} of creation`
			);

		webhook
			.send({
				username: "Ticket Closed",
				avatarURL: "https://i.imgur.com/5ShDA4g.png",
				embeds: [embed],
			})
			.catch((e) => console.log(e));
	}

	if (logs.LogType === "ticketDelete") {
		const embed = new Discord.EmbedBuilder()
			.setColor("#ed4245")
			.setAuthor({ name: logs.user.tag, iconURL: logs.user.displayAvatarURL() })
			.setDescription(
				`${logs.user.tag} (<@${logs.user.id}>) Deleted the ticket n°${logs.ticketId} after ${client.msToHm(
					new Date(Number(BigInt(Date.now()) - BigInt(logs.ticketCreatedAt)))
				)} of creation\n\nTranscript: ${logs.transcriptURL}`
			);

		webhook
			.send({
				username: "Ticket Deleted",
				avatarURL: "https://i.imgur.com/obTW2BS.png",
				embeds: [embed],
			})
			.catch((e) => console.log(e));
	}

	if (logs.LogType === "userAdded") {
		const embed = new Discord.EmbedBuilder()
			.setColor("#3ba55c")
			.setAuthor({ name: logs.user.tag, iconURL: logs.user.displayAvatarURL() })
			.setDescription(
				`${logs.user.tag} (<@${logs.user.id}>) Added <@${logs.target.id}> (${logs.target.id}) to the ticket n°${logs.ticketId} (<#${logs.ticketChannelId}>)`
			);

		webhook
			.send({
				username: "User Added",
				avatarURL: "https://i.imgur.com/G6QPFBV.png",
				embeds: [embed],
			})
			.catch((e) => console.log(e));
	}
	if (logs.LogType === "userRemoved") {
		const embed = new Discord.EmbedBuilder()
			.setColor("#ed4245")
			.setAuthor({ name: logs.user.tag, iconURL: logs.user.displayAvatarURL() })
			.setDescription(
				`${logs.user.tag} (<@${logs.user.id}>) Removed <@${logs.target.id}> (${logs.target.id}) from the ticket n°${logs.ticketId} (<#${logs.ticketChannelId}>)`
			);
		webhook
			.send({
				username: "User Removed",
				avatarURL: "https://i.imgur.com/eFJ8xxC.png",
				embeds: [embed],
			})
			.catch((e) => console.log(e));
	}
};

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
