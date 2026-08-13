import {
	type Connection,
	Server,
	type WSMessage,
	routePartykitRequest,
} from "partyserver";

import type { ChatMessage, Message, UserProfile } from "../shared";

export class Chat extends Server<Env> {
	static options = { hibernate: true };

	messages: ChatMessage[] = [];
	users: UserProfile[] = [];

	onStart() {
		this.ctx.storage.sql.exec(`
			CREATE TABLE IF NOT EXISTS messages (
				id TEXT PRIMARY KEY,
				senderId TEXT NOT NULL,
				receiverId TEXT NOT NULL,
				content TEXT NOT NULL,
				timestamp INTEGER NOT NULL
			)
		`);

		this.ctx.storage.sql.exec(`
			CREATE TABLE IF NOT EXISTS users (
				id TEXT PRIMARY KEY,
				username TEXT UNIQUE NOT NULL,
				age INTEGER NOT NULL,
				country TEXT NOT NULL,
				state TEXT NOT NULL,
				gender TEXT NOT NULL,
				avatar TEXT NOT NULL,
				online INTEGER NOT NULL DEFAULT 0
			)
		`);

		this.messages = this.ctx.storage.sql
			.exec(`SELECT * FROM messages ORDER BY timestamp ASC`)
			.toArray() as ChatMessage[];

		this.users = this.ctx.storage.sql
			.exec(`SELECT * FROM users`)
			.toArray()
			.map((user) => ({
				...user,
				online: Boolean(user.online),
			})) as UserProfile[];
	}

	onConnect(connection: Connection) {
		connection.send(
			JSON.stringify({
				type: "history",
				messages: this.messages,
			} satisfies Message),
		);

		connection.send(
			JSON.stringify({
				type: "users",
				users: this.users,
			} satisfies Message),
		);
	}

	onMessage(connection: Connection, message: WSMessage) {
		try {
			const parsed = JSON.parse(message as string) as Message;

			if (parsed.type === "chat") {
				this.saveMessage(parsed.message);

				this.broadcast(
					JSON.stringify(parsed),
				);

				return;
			}

			if (parsed.type === "users") {
				this.users = parsed.users;

				this.ctx.storage.sql.exec(`DELETE FROM users`);

				for (const user of this.users) {
					this.ctx.storage.sql.exec(
						`INSERT INTO users
						(id, username, age, country, state, gender, avatar, online)
						VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
						user.id,
						user.username,
						user.age,
						user.country,
						user.state,
						user.gender,
						user.avatar,
						user.online ? 1 : 0,
					);
				}

				this.broadcast(JSON.stringify(parsed));
			}
		} catch {
			connection.send(
				JSON.stringify({
					type: "error",
					message: "Invalid message.",
				} satisfies Message),
			);
		}
	}

	saveMessage(message: ChatMessage) {
		this.messages.push(message);

		this.ctx.storage.sql.exec(
			`INSERT INTO messages
			(id, senderId, receiverId, content, timestamp)
			VALUES (?, ?, ?, ?, ?)`,
			message.id,
			message.senderId,
			message.receiverId,
			message.content,
			message.timestamp,
		);
	}
}

export default {
	async fetch(request, env) {
		return (
			(await routePartykitRequest(request, { ...env })) ||
			env.ASSETS.fetch(request)
		);
	},
} satisfies ExportedHandler<Env>;
