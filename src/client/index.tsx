import { createRoot } from "react-dom/client";
import { usePartySocket } from "partysocket/react";
import React, { useState } from "react";
import { nanoid } from "nanoid";

import type { ChatMessage, Message } from "../shared";

function App() {
	const [userId] = useState(() => nanoid(10));
	const [username] = useState(() => `Guest-${nanoid(5)}`);
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [text, setText] = useState("");

	const socket = usePartySocket({
		party: "chat",
		room: "main",

		onMessage: (evt) => {
			const message = JSON.parse(evt.data as string) as Message;

			if (message.type === "history") {
				setMessages(message.messages);
			}

			if (message.type === "chat") {
				setMessages((current) => {
					if (current.some((item) => item.id === message.message.id)) {
						return current;
					}

					return [...current, message.message];
				});
			}
		},
	});

	function sendMessage(e: React.FormEvent) {
		e.preventDefault();

		const content = text.trim();

		if (!content) return;

		const message: ChatMessage = {
			id: nanoid(10),
			senderId: userId,
			receiverId: "main",
			content,
			timestamp: Date.now(),
		};

		setMessages((current) => [...current, message]);

		socket.send(
			JSON.stringify({
				type: "chat",
				message,
			} satisfies Message),
		);

		setText("");
	}

	return (
		<div
			style={{
				maxWidth: "700px",
				margin: "40px auto",
				padding: "20px",
				fontFamily: "Arial, sans-serif",
			}}
		>
			<h2>BHARAT CHAT</h2>

			<p>
				Logged in as <strong>{username}</strong>
			</p>

			<div
				style={{
					minHeight: "400px",
					border: "1px solid #ddd",
					borderRadius: "12px",
					padding: "15px",
					marginBottom: "15px",
				}}
			>
				{messages.length === 0 ? (
					<p>No messages yet.</p>
				) : (
					messages.map((message) => (
						<div
							key={message.id}
							style={{
								marginBottom: "10px",
								padding: "8px 12px",
								borderRadius: "10px",
								background:
									message.senderId === userId
										? "#e8f0ff"
										: "#f3f3f3",
							}}
						>
							<strong>
								{message.senderId === userId ? "You" : "User"}
							</strong>
							<div>{message.content}</div>
						</div>
					))
				)}
			</div>

			<form
				onSubmit={sendMessage}
				style={{
					display: "flex",
					gap: "10px",
				}}
			>
				<input
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Type a message..."
					autoComplete="off"
					style={{
						flex: 1,
						padding: "12px",
						borderRadius: "8px",
						border: "1px solid #ccc",
					}}
				/>

				<button type="submit">Send</button>
			</form>
		</div>
	);
}

createRoot(document.getElementById("root")!).render(<App />);
