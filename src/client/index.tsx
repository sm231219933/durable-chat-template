import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { usePartySocket } from "partysocket/react";
import { nanoid } from "nanoid";

import {
  avatarOptions,
  countries,
  genders,
  states,
  type ChatMessage,
  type Gender,
  type Message,
  type UserProfile,
} from "../shared";



const USER_KEY = "bharat-chat-user";

function avatarEmoji(avatar: string, gender: Gender) {
  if (avatar.includes("2")) return gender === "female" ? "👩🏻" : gender === "male" ? "👨🏻" : "🧑🏻";
  if (avatar.includes("3")) return gender === "female" ? "👩🏽" : gender === "male" ? "👨🏽" : "🧑🏽";
  if (avatar.includes("4")) return gender === "female" ? "👩🏿" : gender === "male" ? "👨🏿" : "🧑🏿";

  return gender === "female" ? "👩" : gender === "male" ? "👨" : "🧑";
}

function genderColor(gender: Gender) {
  if (gender === "female") return "female";
  if (gender === "male") return "male";
  return "neutral";
}

function flag(country: string) {
  if (country === "India") return "🇮🇳";
  if (country === "United States") return "🇺🇸";
  if (country === "United Kingdom") return "🇬🇧";
  if (country === "Canada") return "🇨🇦";
  if (country === "Australia") return "🇦🇺";
  return "🌎";
}

function saveUser(user: UserProfile) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function loadUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Something went wrong");
  }

  return data;
}

function Avatar({
  user,
  size = "normal",
}: {
  user: Pick<UserProfile, "avatar" | "gender">;
  size?: "small" | "normal" | "large";
}) {
  return (
    <div
      className={`avatar avatar-${genderColor(user.gender)} avatar-${size}`}
      title={user.gender}
    >
      {avatarEmoji(user.avatar, user.gender)}
    </div>
  );
}

function Logo() {
  return (
    <div className="brand">
      <div className="brand-icon">🇮🇳</div>
      <div>
        <div className="brand-name">BHARAT CHAT</div>
        <div className="brand-subtitle">Meet people. Talk freely.</div>
      </div>
    </div>
  );
}

function ProfileScreen({
  onComplete,
}: {
  onComplete: (user: UserProfile) => void;
}) {
  const [mode, setMode] = useState<"guest" | "login" | "signup">("guest");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("Madhya Pradesh");
  const [gender, setGender] = useState<Gender>("neutral");
  const [avatar, setAvatar] = useState("neutral-1");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedAvatars = useMemo(
    () =>
      avatarOptions.filter((item) => {
        if (gender === "female") return item.startsWith("female");
        if (gender === "male") return item.startsWith("male");
        return item.startsWith("neutral");
      }),
    [gender],
  );

  useEffect(() => {
    setAvatar(selectedAvatars[0] || "neutral-1");
  }, [gender]);

  async function guest() {
    setError("");

    if (!age || Number(age) < 13 || Number(age) > 100) {
      setError("Please enter a valid age (13–100).");
      return;
    }

    setLoading(true);

    try {
      const randomUsername =
        "Guest_" + Math.random().toString(36).substring(2, 8);

      const result = await api<{ user: UserProfile }>("/api/register", {
        method: "POST",
        body: JSON.stringify({
          username: randomUsername,
          password: "",
          age: Number(age),
          country,
          state,
          gender,
          avatar,
        }),
      });

      saveUser(result.user);
      onComplete(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create profile.");
    } finally {
      setLoading(false);
    }
  }

  async function signup() {
    setError("");

    if (username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (!age || Number(age) < 13 || Number(age) > 100) {
      setError("Please enter a valid age.");
      return;
    }

    setLoading(true);

    try {
      const result = await api<{ user: UserProfile }>("/api/register", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          age: Number(age),
          country,
          state,
          gender,
          avatar,
        }),
      });

      saveUser(result.user);
      onComplete(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    setError("");

    if (!username || !password) {
      setError("Enter username and password.");
      return;
    }

    setLoading(true);

    try {
      const result = await api<{ user: UserProfile }>("/api/login", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
        }),
      });

      saveUser(result.user);
      onComplete(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "login") {
    return (
      <div className="page">
        <header className="topbar">
          <Logo />
        </header>

        <main className="auth-area">
          <div className="auth-card">
            <div className="auth-icon">🔐</div>

            <h1>Welcome back</h1>
            <p className="muted">Login to your Bharat Chat profile.</p>

            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your username"
              autoComplete="username"
            />

            <label>Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Your password"
              autoComplete="current-password"
            />

            {error && <div className="error">{error}</div>}

            <button className="primary-button" onClick={login} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>

            <button className="text-button" onClick={() => setMode("signup")}>
              Create a new account
            </button>

            <button className="text-button" onClick={() => setMode("guest")}>
              Continue as guest
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="topbar">
        <Logo />

        <div className="top-actions">
          <button className="outline-button" onClick={() => setMode("login")}>
            Login
          </button>

          <button className="small-primary" onClick={() => setMode("signup")}>
            Sign up
          </button>
        </div>
      </header>

      <main className="profile-area">
        <div className="profile-card">
          <div className="hero-badge">✨ FREE • ANONYMOUS • FAST</div>

          <h1>Create your profile</h1>

          <p className="hero-text">
            Meet people from India and around the world.
            <br />
            Choose who you want to talk with.
          </p>

          {mode === "guest" && (
            <>
              <div className="section-title">Quick profile</div>

              <div className="field-row">
                <div className="field">
                  <label>Age</label>
                  <input
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    type="number"
                    min="13"
                    max="100"
                    placeholder="Your age"
                  />
                </div>

                <div className="field">
                  <label>Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    {countries.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label>State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                {states.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <label>Gender</label>

              <div className="gender-grid">
                {genders.map((item) => (
                  <button
                    key={item.value}
                    className={`gender-choice ${
                      gender === item.value ? "selected" : ""
                    } ${genderColor(item.value)}`}
                    onClick={() => setGender(item.value)}
                    type="button"
                  >
                    <span>
                      {item.value === "female"
                        ? "👩"
                        : item.value === "male"
                          ? "👨"
                          : "🧑"}
                    </span>
                    {item.label.replace(/^[^\s]+\s/, "")}
                  </button>
                ))}
              </div>

              <label>Choose your face</label>

              <div className="avatar-grid">
                {selectedAvatars.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`avatar-select ${
                      avatar === item ? "avatar-selected" : ""
                    }`}
                    onClick={() => setAvatar(item)}
                  >
                    <Avatar
                      user={{
                        avatar: item,
                        gender,
                      }}
                      size="large"
                    />
                  </button>
                ))}
              </div>

              {error && <div className="error">{error}</div>}

              <button
                className="primary-button big-button"
                onClick={guest}
                disabled={loading}
              >
                {loading ? "Creating..." : "Start Chatting →"}
              </button>

              <div className="login-hint">
                Want the same profile every day?
                <button onClick={() => setMode("signup")}>Create an account</button>
              </div>
            </>
          )}

          {mode === "signup" && (
            <>
              <div className="section-title">Create your account</div>

              <label>Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Unique username"
                autoComplete="username"
              />

              <label>Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="At least 6 characters"
                autoComplete="new-password"
              />

              <div className="field-row">
                <div className="field">
                  <label>Age</label>
                  <input
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    type="number"
                    min="13"
                    max="100"
                    placeholder="Age"
                  />
                </div>

                <div className="field">
                  <label>Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  >
                    {countries.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
              </div>

              <label>State</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                {states.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>

              <label>Gender</label>

              <div className="gender-grid">
                {genders.map((item) => (
                  <button
                    key={item.value}
                    className={`gender-choice ${
                      gender === item.value ? "selected" : ""
                    } ${genderColor(item.value)}`}
                    onClick={() => setGender(item.value)}
                    type="button"
                  >
                    <span>
                      {item.value === "female"
                        ? "👩"
                        : item.value === "male"
                          ? "👨"
                          : "🧑"}
                    </span>
                    {item.label.replace(/^[^\s]+\s/, "")}
                  </button>
                ))}
              </div>

              <label>Choose your face</label>

              <div className="avatar-grid">
                {selectedAvatars.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`avatar-select ${
                      avatar === item ? "avatar-selected" : ""
                    }`}
                    onClick={() => setAvatar(item)}
                  >
                    <Avatar
                      user={{
                        avatar: item,
                        gender,
                      }}
                      size="large"
                    />
                  </button>
                ))}
              </div>

              {error && <div className="error">{error}</div>}

              <button
                className="primary-button big-button"
                onClick={signup}
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create Account →"}
              </button>

              <button
                className="text-button"
                onClick={() => setMode("login")}
              >
                Already have an account? Login
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function UserCard({
  user,
  currentUser,
  onOpen,
}: {
  user: UserProfile;
  currentUser: UserProfile;
  onOpen: (user: UserProfile) => void;
}) {
  if (user.id === currentUser.id) return null;

  return (
    <button className="user-card" onClick={() => onOpen(user)}>
      <Avatar user={user} size="normal" />

      <div className="user-info">
        <div className="user-name">
          {user.username}
          <span className="online-dot" />
        </div>

        <div className="user-meta">
          <span>{user.age}</span>
          <span>{flag(user.country)}</span>
          <span>{user.state}</span>
        </div>
      </div>

      <div className="chat-arrow">›</div>
    </button>
  );
}

function UsersScreen({
  currentUser,
  onLogout,
}: {
  currentUser: UserProfile;
  onLogout: () => void;
}) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [gender, setGender] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  async function loadUsers() {
    const params = new URLSearchParams();

    if (country) params.set("country", country);
    if (state) params.set("state", state);
    if (gender) params.set("gender", gender);

    try {
      const result = await api<{ users: UserProfile[] }>(
        `/api/users?${params.toString()}`,
      );

      setUsers(result.users);
    } catch {
      setUsers([]);
    }
  }

  useEffect(() => {
    loadUsers();

    const timer = window.setInterval(loadUsers, 5000);

    return () => window.clearInterval(timer);
  }, [country, state, gender]);

  if (selectedUser) {
    return (
      <ChatScreen
        currentUser={currentUser}
        otherUser={selectedUser}
        onBack={() => setSelectedUser(null)}
      />
    );
  }

  return (
    <div className="app-page">
      <header className="app-header">
        <Logo />

        <div className="current-user">
          <button
            className="current-user-button"
            onClick={() => setShowProfile(!showProfile)}
          >
            <Avatar user={currentUser} size="small" />
            <span>{currentUser.username}</span>
          </button>

          {showProfile && (
            <div className="profile-menu">
              <div className="profile-menu-user">
                <Avatar user={currentUser} size="normal" />
                <strong>{currentUser.username}</strong>
              </div>

              <div className="profile-detail">
                {currentUser.age} years • {flag(currentUser.country)}
              </div>

              <div className="profile-detail">{currentUser.state}</div>

              <button onClick={onLogout}>Logout</button>
            </div>
          )}
        </div>
      </header>

      <main className="users-area">
        <div className="users-heading">
          <div>
            <div className="live-label">
              <span className="online-dot" />
              PEOPLE ONLINE
            </div>

            <h1>Who do you want to talk to?</h1>

            <p>
              Click any profile to start a private conversation.
            </p>
          </div>
        </div>

        <div className="filters">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="">🌎 All countries</option>
            {countries.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
          >
            <option value="">📍 All states</option>
            {states.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
          >
            <option value="">👥 All genders</option>
            <option value="female">👩 Female</option>
            <option value="male">👨 Male</option>
            <option value="neutral">🧑 Neutral</option>
          </select>
        </div>

        <div className="user-list">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              currentUser={currentUser}
              onOpen={setSelectedUser}
            />
          ))}

          {users.filter((u) => u.id !== currentUser.id).length === 0 && (
            <div className="empty-users">
              <div className="empty-icon">👋</div>
              <h3>No one found</h3>
              <p>Try changing the filters.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ChatScreen({
  currentUser,
  otherUser,
  onBack,
}: {
  currentUser: UserProfile;
  otherUser: UserProfile;
  onBack: () => void;
}) {
  const roomId = [
    currentUser.id,
    otherUser.id,
  ]
    .sort()
    .join("-");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<number | null>(null);

  const socket = usePartySocket({
    party: "chat",
    room: roomId,

    onMessage: (event) => {
      try {
        const message = JSON.parse(event.data as string) as Message;

        if (message.type === "all") {
          setMessages(message.messages);
        }

        if (message.type === "add") {
          setMessages((old) => {
            if (old.some((item) => item.id === message.id)) {
              return old;
            }

            return [
              ...old,
              {
                id: message.id,
                content: message.content,
                user: message.user,
                role: message.role,
                senderId: message.senderId,
                image: message.image,
                createdAt: message.createdAt,
              },
            ];
          });
        }

        if (message.type === "typing") {
          if (message.userId === otherUser.id) {
            setTyping(message.typing);
          }
        }
      } catch {
        // Ignore invalid messages.
      }
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  function sendTyping(value: string) {
    setText(value);

    socket.send(
      JSON.stringify({
        type: "typing",
        userId: currentUser.id,
        username: currentUser.username,
        typing: true,
      }),
    );

    if (typingTimer.current) {
      window.clearTimeout(typingTimer.current);
    }

    typingTimer.current = window.setTimeout(() => {
      socket.send(
        JSON.stringify({
          type: "typing",
          userId: currentUser.id,
          username: currentUser.username,
          typing: false,
        }),
      );
    }, 900);
  }

  function sendMessage() {
    const content = text.trim();

    if (!content || blocked) return;

    const message: ChatMessage = {
      id: nanoid(12),
      content,
      user: currentUser.username,
      role: "user",
      senderId: currentUser.id,
      createdAt: Date.now(),
    };

    setMessages((old) => [...old, message]);

    socket.send(
      JSON.stringify({
        type: "add",
        ...message,
      } satisfies Message),
    );

    setText("");
  }

  async function block() {
    const confirmed = window.confirm(
      `Block ${otherUser.username}? They won't be able to contact you.`,
    );

    if (!confirmed) return;

    try {
      await api("/api/block", {
        method: "POST",
        body: JSON.stringify({
          blockerId: currentUser.id,
          blockedId: otherUser.id,
        }),
      });

      setBlocked(true);
    } catch {
      alert("Unable to block this user right now.");
    }
  }

  return (
    <div className="chat-page">
      <header className="chat-header">
        <button className="back-button" onClick={onBack}>
          ←
        </button>

        <Avatar user={otherUser} size="small" />

        <div className="chat-user-details">
          <strong>{otherUser.username}</strong>

          <span>
            <span className="online-dot" />
            Online • {otherUser.age} • {flag(otherUser.country)}{" "}
            {otherUser.state}
          </span>
        </div>

        <button className="block-button" onClick={block}>
          🚫 Block
        </button>
      </header>

      <main className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-start">
            <Avatar user={otherUser} size="large" />

            <h2>Say hello to {otherUser.username} 👋</h2>

            <p>
              This is a private one-to-one conversation.
            </p>
          </div>
        )}

        {messages.map((message) => {
          const mine = message.senderId === currentUser.id ||
            message.user === currentUser.username;

          return (
            <div
              key={message.id}
              className={`message-row ${mine ? "mine" : "theirs"}`}
            >
              {!mine && (
                <Avatar user={otherUser} size="small" />
              )}

              <div className={`bubble ${mine ? "mine" : "theirs"}`}>
                {message.image && (
                  <img
                    src={message.image}
                    alt="Shared"
                    className="shared-image"
                  />
                )}

                {message.content && (
                  <div>{message.content}</div>
                )}

                <span className="message-time">
                  {message.createdAt
                    ? new Date(message.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="typing">
            {otherUser.username} is typing...
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      {blocked ? (
        <div className="blocked-bar">
          🚫 You blocked {otherUser.username}.
        </div>
      ) : (
        <form
          className="chat-input-area"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <button
            type="button"
            className="image-button"
            title="Image sharing"
            onClick={() =>
              alert("Image sharing UI is ready. File upload will be connected next.")
            }
          >
            📷
          </button>

          <input
            value={text}
            onChange={(e) => sendTyping(e.target.value)}
            placeholder={`Message ${otherUser.username}...`}
            autoComplete="off"
          />

          <button className="send-button" type="submit">
            ➤
          </button>
        </form>
      )}
    </div>
  );
}

function App() {
  const [user, setUser] = useState<UserProfile | null>(() => loadUser());

  function logout() {
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  if (!user) {
    return <ProfileScreen onComplete={setUser} />;
  }

  return (
    <UsersScreen
      currentUser={user}
      onLogout={logout}
    />
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
