export type Gender = "male" | "female" | "neutral";

export type UserProfile = {
  id: string;
  username: string;
  age: number;
  country: string;
  state: string;
  gender: Gender;
  avatar: string;
  last_seen?: number;
};

export type ChatMessage = {
  id: string;
  content: string;
  user: string;
  role: "user" | "assistant";
  senderId?: string;
  image?: string;
  createdAt?: number;
};

export type Message =
  | {
      type: "add";
      id: string;
      content: string;
      user: string;
      role: "user" | "assistant";
      senderId?: string;
      image?: string;
      createdAt?: number;
    }
  | {
      type: "update";
      id: string;
      content: string;
      user: string;
      role: "user" | "assistant";
      senderId?: string;
      image?: string;
      createdAt?: number;
    }
  | {
      type: "all";
      messages: ChatMessage[];
    }
  | {
      type: "typing";
      userId: string;
      username: string;
      typing: boolean;
    }
  | {
      type: "user_joined";
      user: UserProfile;
    }
  | {
      type: "user_left";
      userId: string;
    }
  | {
      type: "blocked";
      userId: string;
    };

export const genders: {
  value: Gender;
  label: string;
}[] = [
  {
    value: "female",
    label: "👩 Female",
  },
  {
    value: "male",
    label: "👨 Male",
  },
  {
    value: "neutral",
    label: "🧑 Neutral",
  },
];

export const countries = [
  "India",
  "United States",
  "United Kingdom",
  "Canada",
  "Australia",
  "Other",
];

export const states = [
  "Madhya Pradesh",
  "Delhi",
  "Maharashtra",
  "Rajasthan",
  "Gujarat",
  "Uttar Pradesh",
  "Karnataka",
  "West Bengal",
  "Tamil Nadu",
  "Other",
];

export const avatarOptions = [
  "female-1",
  "female-2",
  "female-3",
  "female-4",
  "male-1",
  "male-2",
  "male-3",
  "male-4",
  "neutral-1",
  "neutral-2",
  "neutral-3",
  "neutral-4",
];
