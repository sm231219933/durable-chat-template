export type Gender = "male" | "female" | "neutral";

export type Avatar = {
	id: string;
	gender: Gender;
};

export type UserProfile = {
	id: string;
	username: string;
	age: number;
	country: string;
	state: string;
	gender: Gender;
	avatar: string;
	online: boolean;
};

export type ChatMessage = {
	id: string;
	senderId: string;
	receiverId: string;
	content: string;
	timestamp: number;
};

export type Message =
	| {
			type: "chat";
			message: ChatMessage;
	  }
	| {
			type: "history";
			messages: ChatMessage[];
	  }
	| {
			type: "users";
			users: UserProfile[];
	  }
	| {
			type: "error";
			message: string;
	  };
