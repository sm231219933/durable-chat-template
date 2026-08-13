import { createRoot } from "react-dom/client";
import React, { useMemo, useState } from "react";
import { nanoid } from "nanoid";

type Gender = "male" | "female" | "neutral";

type Profile = {
	id: string;
	username: string;
	age: number;
	country: string;
	state: string;
	gender: Gender;
	avatar: string;
};

type DemoUser = Profile & {
	online: boolean;
};

const demoUsers: DemoUser[] = [
	{
		id: "demo-1",
		username: "Rahul24",
		age: 24,
		country: "India",
		state: "Madhya Pradesh",
		gender: "male",
		avatar: "👨",
		online: true,
	},
	{
		id: "demo-2",
		username: "Priya22",
		age: 22,
		country: "India",
		state: "Delhi",
		gender: "female",
		avatar: "👩",
		online: true,
	},
	{
		id: "demo-3",
		username: "Aman27",
		age: 27,
		country: "India",
		state: "Gujarat",
		gender: "neutral",
		avatar: "🧑",
		online: true,
	},
	{
		id: "demo-4",
		username: "Neha25",
		age: 25,
		country: "India",
		state: "Maharashtra",
		gender: "female",
		avatar: "👩‍🦰",
		online: true,
	},
	{
		id: "demo-5",
		username: "Vikas29",
		age: 29,
		country: "India",
		state: "Rajasthan",
		gender: "male",
		avatar: "👨‍🦱",
		online: false,
	},
];

const avatarOptions: Record<Gender, string[]> = {
	female: ["👩", "👩‍🦰", "👩‍🦱", "👩‍🦳", "👩‍🦲"],
	male: ["👨", "👨‍🦱", "👨‍🦰", "👨‍🦳", "👨‍🦲"],
	neutral: ["🧑", "🧑‍🦱", "🧑‍🦰", "🧑‍🦳", "🧑‍🦲"],
};

const genderColor: Record<Gender, string> = {
	female: "#ff4f9a",
	male: "#4285f4",
	neutral: "#27b66d",
};

function App() {
	const [profile, setProfile] = useState<Profile | null>(() => {
		try {
			const saved = localStorage.getItem("bharat-chat-profile");
			return saved ? JSON.parse(saved) : null;
		} catch {
			return null;
		}
	});

	const [selectedUser, setSelectedUser] = useState<DemoUser | null>(null);
	const [filter, setFilter] = useState<"all" | Gender>("all");
	const [search, setSearch] = useState("");

	if (!profile) {
		return <ProfileScreen onComplete={setProfile} />;
	}

	if (selectedUser) {
		return (
			<ChatScreen
				me={profile}
				user={selectedUser}
				onBack={() => setSelectedUser(null)}
			/>
		);
	}

	return (
		<UsersScreen
			profile={profile}
			users={demoUsers}
			filter={filter}
			setFilter={setFilter}
			search={search}
			setSearch={setSearch}
			onUserClick={setSelectedUser}
			onLogout={() => {
				localStorage.removeItem("bharat-chat-profile");
				setProfile(null);
			}}
		/>
	);
}

function ProfileScreen({
	onComplete,
}: {
	onComplete: (profile: Profile) => void;
}) {
	const [username, setUsername] = useState("");
	const [age, setAge] = useState("");
	const [country, setCountry] = useState("India");
	const [state, setState] = useState("Madhya Pradesh");
	const [gender, setGender] = useState<Gender>("male");
	const [avatar, setAvatar] = useState(avatarOptions.male[0]);
	const [error, setError] = useState("");

	const chooseGender = (value: Gender) => {
		setGender(value);
		setAvatar(avatarOptions[value][0]);
	};

	const enterChat = (e: React.FormEvent) => {
		e.preventDefault();

		const cleanUsername = username.trim();

		if (cleanUsername.length < 3) {
			setError("Username kam se kam 3 characters ka hona chahiye.");
			return;
		}

		const numericAge = Number(age);

		if (!numericAge || numericAge < 13 || numericAge > 100) {
			setError("Age 13 se 100 ke beech honi chahiye.");
			return;
		}

		const newProfile: Profile = {
			id: nanoid(12),
			username: cleanUsername,
			age: numericAge,
			country,
			state,
			gender,
			avatar,
		};

		localStorage.setItem(
			"bharat-chat-profile",
			JSON.stringify(newProfile),
		);

		onComplete(newProfile);
	};

	return (
		<div className="app-shell">
			<div className="profile-card">
				<div className="brand">
					<div className="brand-icon">🇮🇳</div>
					<div>
						<div className="brand-title">BHARAT CHAT</div>
						<div className="brand-subtitle">
							Meet people. Talk freely.
						</div>
					</div>
				</div>

				<div className="profile-heading">
					<h1>Create your profile</h1>
					<p>Enter your details and start chatting.</p>
				</div>

				<form onSubmit={enterChat}>
					<label>Username</label>
					<input
						value={username}
						onChange={(e) => setUsername(e.target.value)}
						placeholder="Choose a unique username"
						maxLength={20}
						autoComplete="off"
					/>

					<label>Age</label>
					<input
						value={age}
						onChange={(e) => setAge(e.target.value)}
						type="number"
						min="13"
						max="100"
						placeholder="Your age"
					/>

					<div className="two-fields">
						<div>
							<label>Country</label>
							<select
								value={country}
								onChange={(e) => setCountry(e.target.value)}
							>
								<option>India</option>
								<option>United States</option>
								<option>United Kingdom</option>
								<option>Canada</option>
								<option>Australia</option>
								<option>Other</option>
							</select>
						</div>

						<div>
							<label>State</label>
							<select
								value={state}
								onChange={(e) => setState(e.target.value)}
							>
								<option>Madhya Pradesh</option>
								<option>Delhi</option>
								<option>Maharashtra</option>
								<option>Rajasthan</option>
								<option>Gujarat</option>
								<option>Uttar Pradesh</option>
								<option>Karnataka</option>
								<option>West Bengal</option>
								<option>Tamil Nadu</option>
								<option>Other</option>
							</select>
						</div>
					</div>

					<label>Gender</label>

					<div className="gender-grid">
						<GenderButton
							gender="female"
							selected={gender === "female"}
							onClick={() => chooseGender("female")}
							icon="👩"
							label="Female"
						/>

						<GenderButton
							gender="male"
							selected={gender === "male"}
							onClick={() => chooseGender("male")}
							icon="👨"
							label="Male"
						/>

						<GenderButton
							gender="neutral"
							selected={gender === "neutral"}
							onClick={() => chooseGender("neutral")}
							icon="🧑"
							label="Neutral"
						/>
					</div>

					<label>Choose your face</label>

					<div className="avatar-grid">
						{avatarOptions[gender].map((item) => (
							<button
								type="button"
								key={item}
								className={`avatar-option ${
									avatar === item ? "selected" : ""
								}`}
								onClick={() => setAvatar(item)}
								style={{
									borderColor:
										avatar === item
											? genderColor[gender]
											: undefined,
								}}
							>
								{item}
							</button>
						))}
					</div>

					{error && <div className="error">{error}</div>}

					<button className="primary-button" type="submit">
						Enter Chat <span>→</span>
					</button>

					<div className="login-hint">
						Already registered?{" "}
						<button
							type="button"
							onClick={() =>
								alert(
									"Login system next step mein add karenge.",
								)
							}
						>
							Login
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}

function GenderButton({
	gender,
	selected,
	onClick,
	icon,
	label,
}: {
	gender: Gender;
	selected: boolean;
	onClick: () => void;
	icon: string;
	label: string;
}) {
	return (
		<button
			type="button"
			className={`gender-button ${selected ? "selected" : ""}`}
			onClick={onClick}
			style={
				selected
					? {
							borderColor: genderColor[gender],
							background: `${genderColor[gender]}12`,
						}
					: undefined
			}
		>
			<span
				className="gender-icon"
				style={{ background: genderColor[gender] }}
			>
				{icon}
			</span>
			<span>{label}</span>
		</button>
	);
}

function UsersScreen({
	profile,
	users,
	filter,
	setFilter,
	search,
	setSearch,
	onUserClick,
	onLogout,
}: {
	profile: Profile;
	users: DemoUser[];
	filter: "all" | Gender;
	setFilter: (filter: "all" | Gender) => void;
	search: string;
	setSearch: (search: string) => void;
	onUserClick: (user: DemoUser) => void;
	onLogout: () => void;
}) {
	const filteredUsers = useMemo(() => {
		return users.filter((user) => {
			const genderMatch = filter === "all" || user.gender === filter;

			const searchMatch =
				user.username.toLowerCase().includes(search.toLowerCase()) ||
				user.state.toLowerCase().includes(search.toLowerCase());

			return genderMatch && searchMatch;
		});
	}, [users, filter, search]);

	return (
		<div className="main-app">
			<header className="topbar">
				<div className="brand compact">
					<div className="brand-icon">🇮🇳</div>
					<div>
						<div className="brand-title">BHARAT CHAT</div>
						<div className="brand-subtitle">People online</div>
					</div>
				</div>

				<button className="my-profile" onClick={onLogout}>
					<span
						className="mini-avatar"
						style={{
							background: genderColor[profile.gender],
						}}
					>
						{profile.avatar}
					</span>
					<span>{profile.username}</span>
				</button>
			</header>

			<main className="users-page">
				<div className="welcome">
					<div>
						<div className="online-title">
							<span className="online-dot" />
							People online
						</div>
						<h1>Who do you want to talk to?</h1>
						<p>
							Click any person to start a private conversation.
						</p>
					</div>

					<div className="user-count">
						<strong>{filteredUsers.length}</strong>
						<span>people</span>
					</div>
				</div>

				<div className="search-box">
					<span>🔎</span>
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search username or state..."
					/>
				</div>

				<div className="filters">
					<FilterButton
						active={filter === "all"}
						onClick={() => setFilter("all")}
					>
						All
					</FilterButton>

					<FilterButton
						active={filter === "female"}
						onClick={() => setFilter("female")}
					>
						🩷 Female
					</FilterButton>

					<FilterButton
						active={filter === "male"}
						onClick={() => setFilter("male")}
					>
						🩵 Male
					</FilterButton>

					<FilterButton
						active={filter === "neutral"}
						onClick={() => setFilter("neutral")}
					>
						💚 Neutral
					</FilterButton>
				</div>

				<div className="users-list">
					{filteredUsers.map((user) => (
						<button
							key={user.id}
							className="user-card"
							onClick={() => onUserClick(user)}
						>
							<div
								className="big-avatar"
								style={{
									background: genderColor[user.gender],
								}}
							>
								{user.avatar}
								{user.online && (
									<span className="online-badge" />
								)}
							</div>

							<div className="user-info">
								<div className="user-name">
									{user.username}
									<span className="age">{user.age}</span>
								</div>

								<div className="user-location">
									🇮🇳 {user.country} · {user.state}
								</div>
							</div>

							<div className="chat-arrow">›</div>
						</button>
					))}

					{filteredUsers.length === 0 && (
						<div className="empty">
							<div>😕</div>
							No users found
						</div>
					)}
				</div>
			</main>
		</div>
	);
}

function FilterButton({
	active,
	onClick,
	children,
}: {
	active: boolean;
	onClick: () => void;
	children: React.ReactNode;
}) {
	return (
		<button
			className={`filter-button ${active ? "active" : ""}`}
			onClick={onClick}
		>
			{children}
		</button>
	);
}

function ChatScreen({
	me,
	user,
	onBack,
}: {
	me: Profile;
	user: DemoUser;
	onBack: () => void;
}) {
	const [message, setMessage] = useState("");

	return (
		<div className="chat-page">
			<header className="chat-header">
				<button className="back-button" onClick={onBack}>
					‹
				</button>

				<div
					className="chat-avatar"
					style={{ background: genderColor[user.gender] }}
				>
					{user.avatar}
					<span className="online-badge" />
				</div>

				<div className="chat-person">
					<strong>{user.username}</strong>
					<span>
						{user.age} · 🇮🇳 {user.state}
					</span>
				</div>

				<button
					className="menu-button"
					onClick={() =>
						alert("Block / Report next step mein add karenge.")
					}
				>
					⋮
				</button>
			</header>

			<div className="chat-body">
				<div className="chat-welcome">
					<div
						className="welcome-avatar"
						style={{ background: genderColor[user.gender] }}
					>
						{user.avatar}
					</div>

					<h2>{user.username}</h2>

					<p>
						{user.age} years old · 🇮🇳 {user.state}
					</p>

					<span>You can start the conversation now.</span>
				</div>
			</div>

			<form
				className="message-bar"
				onSubmit={(e) => {
					e.preventDefault();

					if (!message.trim()) return;

					alert(
						`Realtime message "${message}" next backend step mein connect hoga.`,
					);

					setMessage("");
				}}
			>
				<button type="button" className="attach-button">
					＋
				</button>

				<input
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					placeholder={`Message ${user.username}...`}
				/>

				<button type="submit" className="send-button">
					➤
				</button>
			</form>

			<div className="chat-footer">
				Chatting as <strong>{me.username}</strong>
			</div>
		</div>
	);
}

const styles = `
* {
	box-sizing: border-box;
}

html,
body,
#root {
	margin: 0;
	min-height: 100%;
	width: 100%;
}

body {
	background: #f5f7fb;
	color: #18202f;
	font-family:
		Inter,
		-apple-system,
		BlinkMacSystemFont,
		"Segoe UI",
		Roboto,
		Arial,
		sans-serif;
}

button,
input,
select {
	font: inherit;
}

button {
	cursor: pointer;
}

.app-shell {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 30px 16px;
	background:
		radial-gradient(circle at 15% 15%, #ffe5f0 0, transparent 30%),
		radial-gradient(circle at 85% 85%, #dff5ff 0, transparent 30%),
		#f5f7fb;
}

.profile-card {
	width: min(100%, 500px);
	background: rgba(255, 255, 255, 0.96);
	border: 1px solid #e7eaf0;
	border-radius: 26px;
	padding: 30px;
	box-shadow: 0 25px 70px rgba(20, 30, 55, 0.12);
}

.brand {
	display: flex;
	align-items: center;
	gap: 12px;
}

.brand-icon {
	width: 48px;
	height: 48px;
	border-radius: 15px;
	display: grid;
	place-items: center;
	background: #fff2f7;
	font-size: 25px;
}

.brand-title {
	font-weight: 850;
	letter-spacing: -0.5px;
	font-size: 17px;
}

.brand-subtitle {
	color: #8a92a3;
	font-size: 12px;
	margin-top: 2px;
}

.profile-heading {
	margin: 34px 0 24px;
}

.profile-heading h1 {
	margin: 0 0 8px;
	font-size: 30px;
	letter-spacing: -1px;
}

.profile-heading p {
	margin: 0;
	color: #7b8495;
}

label {
	display: block;
	font-size: 13px;
	font-weight: 700;
	margin: 18px 0 8px;
}

input,
select {
	width: 100%;
	border: 1px solid #dfe3ea;
	background: #fff;
	border-radius: 12px;
	padding: 13px 14px;
	outline: none;
	transition: 0.2s;
}

input:focus,
select:focus {
	border-color: #8e9cff;
	box-shadow: 0 0 0 4px rgba(105, 120, 255, 0.1);
}

.two-fields {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: 12px;
}

.two-fields label {
	margin-top: 18px;
}

.gender-grid {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 8px;
}

.gender-button {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 7px;
	padding: 10px 6px;
	background: #fff;
	border: 1px solid #e1e4ea;
	border-radius: 12px;
	color: #4f5665;
	font-weight: 650;
}

.gender-button.selected {
	color: #222;
}

.gender-icon {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	display: grid;
	place-items: center;
	font-size: 17px;
}

.avatar-grid {
	display: flex;
	gap: 9px;
	flex-wrap: wrap;
}

.avatar-option {
	width: 52px;
	height: 52px;
	border-radius: 15px;
	background: #f7f8fa;
	border: 2px solid transparent;
	font-size: 27px;
}

.avatar-option.selected {
	background: #fff;
	box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
}

.primary-button {
	width: 100%;
	border: 0;
	border-radius: 14px;
	padding: 14px;
	margin-top: 24px;
	background: #202735;
	color: #fff;
	font-weight: 750;
	font-size: 15px;
	box-shadow: 0 10px 25px rgba(32, 39, 53, 0.2);
}

.primary-button span {
	margin-left: 8px;
}

.error {
	margin-top: 12px;
	padding: 10px 12px;
	border-radius: 10px;
	background: #fff0f0;
	color: #d14343;
	font-size: 13px;
}

.login-hint {
	text-align: center;
	margin-top: 18px;
	font-size: 13px;
	color: #8a92a3;
}

.login-hint button {
	border: 0;
	background: transparent;
	color: #5967e8;
	font-weight: 700;
}

.main-app {
	min-height: 100vh;
	background: #f5f7fb;
}

.topbar {
	height: 72px;
	background: rgba(255, 255, 255, 0.92);
	border-bottom: 1px solid #e7eaf0;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 24px;
	position: sticky;
	top: 0;
	z-index: 5;
	backdrop-filter: blur(15px);
}

.brand.compact .brand-icon {
	width: 42px;
	height: 42px;
}

.my-profile {
	display: flex;
	align-items: center;
	gap: 8px;
	border: 0;
	background: #f4f5f8;
	padding: 6px 12px 6px 6px;
	border-radius: 30px;
	font-weight: 650;
	color: #303746;
}

.mini-avatar {
	width: 32px;
	height: 32px;
	border-radius: 50%;
	display: grid;
	place-items: center;
	font-size: 18px;
}

.users-page {
	width: min(900px, 100%);
	margin: auto;
	padding: 38px 20px 60px;
}

.welcome {
	display: flex;
	align-items: flex-end;
	justify-content: space-between;
	gap: 20px;
}

.online-title {
	font-size: 13px;
	font-weight: 750;
	color: #26a764;
	margin-bottom: 8px;
}

.online-dot {
	width: 8px;
	height: 8px;
	background: #28bd70;
	border-radius: 50%;
	display: inline-block;
	margin-right: 5px;
}

.welcome h1 {
	margin: 0;
	font-size: clamp(25px, 5vw, 36px);
	letter-spacing: -1.2px;
}

.welcome p {
	color: #808899;
	margin: 8px 0 0;
}

.user-count {
	background: #fff;
	border: 1px solid #e7eaf0;
	border-radius: 16px;
	padding: 10px 15px;
	text-align: center;
	min-width: 75px;
}

.user-count strong {
	display: block;
	font-size: 22px;
}

.user-count span {
	font-size: 11px;
	color: #8a92a3;
}

.search-box {
	margin-top: 28px;
	background: #fff;
	border: 1px solid #e3e6ec;
	border-radius: 14px;
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 0 14px;
}

.search-box input {
	border: 0;
	box-shadow: none;
	padding-left: 0;
}

.filters {
	display: flex;
	gap: 8px;
	overflow-x: auto;
	padding: 14px 0;
}

.filter-button {
	border: 1px solid #e1e4ea;
	background: #fff;
	color: #697182;
	border-radius: 30px;
	padding: 9px 14px;
	white-space: nowrap;
	font-size: 13px;
	font-weight: 700;
}

.filter-button.active {
	background: #202735;
	color: #fff;
	border-color: #202735;
}

.users-list {
	display: grid;
	gap: 9px;
	margin-top: 4px;
}

.user-card {
	width: 100%;
	display: flex;
	align-items: center;
	gap: 13px;
	text-align: left;
	border: 1px solid #e6e9ef;
	background: #fff;
	border-radius: 17px;
	padding: 12px;
	transition: transform 0.15s, box-shadow 0.15s;
}

.user-card:hover {
	transform: translateY(-2px);
	box-shadow: 0 10px 25px rgba(25, 35, 55, 0.08);
}

.big-avatar {
	width: 50px;
	height: 50px;
	border-radius: 16px;
	display: grid;
	place-items: center;
	font-size: 27px;
	position: relative;
	flex: 0 0 auto;
}

.online-badge {
	position: absolute;
	width: 11px;
	height: 11px;
	border-radius: 50%;
	background: #28c777;
	border: 2px solid #fff;
	right: -1px;
	bottom: -1px;
}

.user-info {
	flex: 1;
	min-width: 0;
}

.user-name {
	font-weight: 800;
	font-size: 15px;
}

.age {
	font-size: 12px;
	font-weight: 600;
	color: #8a92a3;
	margin-left: 7px;
}

.user-location {
	color: #7d8696;
	font-size: 12px;
	margin-top: 5px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.chat-arrow {
	font-size: 28px;
	color: #a5acb8;
}

.empty {
	text-align: center;
	padding: 60px;
	color: #8991a1;
}

.empty div {
	font-size: 35px;
	margin-bottom: 10px;
}

.chat-page {
	height: 100vh;
	display: flex;
	flex-direction: column;
	background: #f7f8fb;
}

.chat-header {
	height: 70px;
	background: #fff;
	border-bottom: 1px solid #e4e7ed;
	display: flex;
	align-items: center;
	gap: 10px;
	padding: 0 15px;
}

.back-button,
.menu-button {
	border: 0;
	background: transparent;
	font-size: 30px;
	color: #4d5564;
	width: 40px;
}

.menu-button {
	margin-left: auto;
	font-size: 25px;
}

.chat-avatar {
	width: 42px;
	height: 42px;
	border-radius: 13px;
	display: grid;
	place-items: center;
	font-size: 23px;
	position: relative;
}

.chat-person {
	display: flex;
	flex-direction: column;
	gap: 3px;
}

.chat-person strong {
	font-size: 15px;
}

.chat-person span {
	font-size: 11px;
	color: #858d9d;
}

.chat-body {
	flex: 1;
	overflow-y: auto;
	display: grid;
	place-items: center;
	padding: 30px;
}

.chat-welcome {
	text-align: center;
	color: #737c8d;
}

.welcome-avatar {
	width: 85px;
	height: 85px;
	border-radius: 28px;
	display: grid;
	place-items: center;
	font-size: 45px;
	margin: auto;
}

.chat-welcome h2 {
	color: #252c39;
	margin: 15px 0 4px;
}

.chat-welcome p {
	margin: 0 0 10px;
}

.chat-welcome span {
	font-size: 13px;
}

.message-bar {
	background: #fff;
	border-top: 1px solid #e4e7ed;
	padding: 10px;
	display: flex;
	gap: 8px;
}

.message-bar input {
	border-radius: 13px;
	background: #f4f6f9;
	border: 0;
}

.attach-button,
.send-button {
	border: 0;
	border-radius: 13px;
	width: 46px;
	flex: 0 0 46px;
	font-size: 21px;
}

.attach-button {
	background: #eef0f4;
	color: #596273;
}

.send-button {
	background: #202735;
	color: #fff;
}

.chat-footer {
	background: #fff;
	text-align: center;
	padding: 5px 10px 9px;
	font-size: 10px;
	color: #a0a6b1;
}

@media (max-width: 600px) {
	.app-shell {
		padding: 12px;
		align-items: flex-start;
	}

	.profile-card {
		margin-top: 10px;
		padding: 22px 18px;
		border-radius: 22px;
	}

	.profile-heading h1 {
		font-size: 27px;
	}

	.topbar {
		padding: 0 12px;
		height: 65px;
	}

	.brand-subtitle {
		display: none;
	}

	.users-page {
		padding: 25px 12px 40px;
	}

	.welcome {
		align-items: center;
	}

	.welcome p {
		display: none;
	}

	.user-count {
		min-width: 65px;
	}

	.two-fields {
		grid-template-columns: 1fr;
		gap: 0;
	}

	.user-card {
		padding: 10px;
	}

	.big-avatar {
		width: 47px;
		height: 47px;
	}

	.my-profile span:last-child {
		display: none;
	}
}
`;

function Style() {
	return <style>{styles}</style>;
}

function Root() {
	return (
		<>
			<Style />
			<App />
		</>
	);
}

createRoot(document.getElementById("root")!).render(<Root />);
