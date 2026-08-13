import {
	type Connection,
	Server,
	type WSMessage,
	routePartykitRequest,
} from "partyserver";

type Gender = "male" | "female" | "neutral";

type UserProfile = {
	id: string;
	username: string;
	age: number;
	country: string;
	state: string;
	gender: Gender;
	avatar: string;
	online: boolean;
};

type ChatMessage = {
	id: string;
	from: string;
	to: string;
	content: string;
	type: "text" | "image";
	createdAt: number;
};

type ClientMessage =
	| {
			type: "register";
			user: UserProfile;
	  }
	| {
			type: "message";
			message: ChatMessage;
	  }
	| {
			type: "block";
			userId: string;
	  }
	| {
			type: "unblock";
			userId: string;
	  }
	| {
			type: "get_users";
	  };

export class Chat extends Server<Env> {
	static options = { hibernate: true };

	users = new Map<string, UserProfile>();
	connections = new Map<string, string>();

	onStart() {
		this.ctx.storage.sql.exec(`
			CREATE TABLE IF NOT EXISTS users (
				id TEXT PRIMARY KEY,
				username TEXT UNIQUE NOT NULL,
				age INTEGER NOT NULL,
				country TEXT NOT NULL,
				state TEXT NOT NULL,
				gender TEXT NOT NULL,
				avatar TEXT NOT NULL
			)
		`);

		this.ctx.storage.sql.exec(`
			CREATE TABLE IF NOT EXISTS blocks (
				user_id TEXT NOT NULL,
				blocked_user_id TEXT NOT NULL,
				PRIMARY KEY (user_id, blocked_user_id)
			)
		`);
	}

	onConnect(connection: Connection) {
		connection.send(
			JSON.stringify({
				type: "connected",
			}),
		);
	}

	onClose(connection: Connection) {
		const userId = this.connections.get(connection.id);

		if (userId) {
			this.connections.delete(connection.id);

			const user = this.users.get(userId);

			if (user) {
				user.online = false;
				this.users.set(userId, user);
			}

			this.broadcastUsers();
		}
	}

	registerUser(connection: Connection, user: UserProfile) {
		const existing = this.ctx.storage.sql
			.exec(
				`SELECT id FROM users WHERE username = ?`,
				user.username,
			)
			.toArray();

		if (existing.length > 0 && existing[0].id !== user.id) {
			connection.send(
				JSON.stringify({
					type: "error",
					message: "Username already exists",
				}),
			);

			return;
		}

		this.ctx.storage.sql.exec(
			`
			INSERT INTO users
			(id, username, age, country, state, gender, avatar)
			VALUES (?, ?, ?, ?, ?, ?, ?)
			ON CONFLICT(id) DO UPDATE SET
				username = ?,
				age = ?,
				country = ?,
				state = ?,
				gender = ?,
				avatar = ?
			`,
			user.id,
			user.username,
			user.age,
			user.country,
			user.state,
			user.gender,
			user.avatar,
			user.username,
			user.age,
			user.country,
			user.state,
			user.gender,
			user.avatar,
		);

		user.online = true;

		this.users.set(user.id, user);
		this.connections.set(connection.id, user.id);

		connection.send(
			JSON.stringify({
				type: "registered",
				user,
			}),
		);

		this.broadcastUsers();
	}

	broadcastUsers() {
		const users = Array.from(this.users.values()).filter(
			(user) => user.online,
		);

		this.broadcast(
			JSON.stringify({
				type: "users",
				users,
			}),
		);
	}

	sendPrivateMessage(message: ChatMessage) {
		const senderConnection = Array.from(
			this.connections.entries(),
		).find(([, userId]) => userId === message.from)?.[0];

		const receiverConnection = Array.from(
			this.connections.entries(),
		).find(([, userId]) => userId === message.to)?.[0];

		if (senderConnection) {
			this.broadcast(
				JSON.stringify({
					type: "message",
					message,
				}),
				receiverConnection ? [receiverConnection] : [],
			);

			const sender = this.getConnection(senderConnection);

			if (sender) {
				sender.send(
					JSON.stringify({
						type: "message",
						message,
					}),
				);
			}
		}

		if (receiverConnection) {
			const receiver = this.getConnection(receiverConnection);

			if (receiver) {
				receiver.send(
					JSON.stringify({
						type: "message",
						message,
					}),
				);
			}
		}
	}

	blockUser(userId: string, blockedUserId: string) {
		this.ctx.storage.sql.exec(
			`
			INSERT OR IGNORE INTO blocks
			(user_id, blocked_user_id)
			VALUES (?, ?)
			`,
			userId,
			blockedUserId,
		);
	}

	unblockUser(userId: string, blockedUserId: string) {
		this.ctx.storage.sql.exec(
			`
			DELETE FROM blocks
			WHERE user_id = ? AND blocked_user_id = ?
			`,
			userId,
			blockedUserId,
		);
	}

	isBlocked(userId: string, otherUserId: string) {
		const result = this.ctx.storage.sql
			.exec(
				`
				SELECT 1 FROM blocks
				WHERE
					(user_id = ? AND blocked_user_id = ?)
					OR
					(user_id = ? AND blocked_user_id = ?)
				LIMIT 1
				`,
				userId,
				otherUserId,
				otherUserId,
				userId,
			)
			.toArray();

		return result.length > 0;
	}

	onMessage(connection: Connection, rawMessage: WSMessage) {
		let message: ClientMessage;

		try {
			message = JSON.parse(rawMessage as string);
		} catch {
			connection.send(
				JSON.stringify({
					type: "error",
					message: "Invalid message",
				}),
			);
			return;
		}

		const currentUserId = this.connections.get(connection.id);

		if (message.type === "register") {
			this.registerUser(connection, message.user);
			return;
		}

		if (!currentUserId) {
			connection.send(
				JSON.stringify({
					type: "error",
					message: "Please register first",
				}),
			);
			return;
		}

		if (message.type === "get_users") {
			this.broadcastUsers();
			return;
		}

		if (message.type === "block") {
			this.blockUser(currentUserId, message.userId);

			connection.send(
				JSON.stringify({
					type: "blocked",
					userId: message.userId,
				}),
			);

			return;
		}

		if (message.type === "unblock") {
			this.unblockUser(currentUserId, message.userId);

			connection.send(
				JSON.stringify({
					type: "unblocked",
					userId: message.userId,
				}),
			);

			return;
		}

		if (message.type === "message") {
			const chatMessage = message.message;

			if (
				chatMessage.from !== currentUserId ||
				chatMessage.from === chatMessage.to
			) {
				return;
			}

			if (this.isBlocked(chatMessage.from, chatMessage.to)) {
				connection.send(
					JSON.stringify({
						type: "error",
						message: "You cannot message this user.",
					}),
				);
				return;
			}

			this.sendPrivateMessage(chatMessage);
		}
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
