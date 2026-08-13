import {
  type Connection,
  Server,
  type WSMessage,
  routePartykitRequest,
} from "partyserver";

import type { ChatMessage, Message } from "../shared";

export class Chat extends Server<Env> {
  static options = { hibernate: true };

  private messages: ChatMessage[] = [];

  onStart() {
    this.ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        user TEXT NOT NULL,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);

    this.messages = this.ctx.storage.sql
      .exec(
        `SELECT id, user, role, content
         FROM messages
         ORDER BY created_at ASC
         LIMIT 200`,
      )
      .toArray() as ChatMessage[];
  }

  onConnect(connection: Connection) {
    connection.send(
      JSON.stringify({
        type: "all",
        messages: this.messages,
      } satisfies Message),
    );
  }

  private saveMessage(message: ChatMessage) {
    this.messages.push(message);

    if (this.messages.length > 200) {
      this.messages.shift();
    }

    this.ctx.storage.sql.exec(
      `INSERT OR REPLACE INTO messages
       (id, user, role, content, created_at)
       VALUES (?, ?, ?, ?, ?)`,
      message.id,
      message.user,
      message.role,
      message.content,
      Date.now(),
    );
  }

  onMessage(_connection: Connection, message: WSMessage) {
    try {
      const parsed = JSON.parse(message as string) as Message;

      if (parsed.type === "add") {
        const chatMessage: ChatMessage = {
          id: parsed.id,
          user: parsed.user,
          role: parsed.role,
          content: parsed.content,
        };

        this.saveMessage(chatMessage);
      }

      this.broadcast(message);
    } catch {
      // Ignore invalid WebSocket messages.
    }
  }
}

async function json(
  data: unknown,
  status = 200,
): Promise<Response> {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
}

function randomId(length = 24) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);

  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function ensureDatabase(db: D1Database) {
  await db.batch([
    db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT,
        age INTEGER NOT NULL,
        country TEXT NOT NULL,
        state TEXT NOT NULL,
        gender TEXT NOT NULL,
        avatar TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_seen INTEGER NOT NULL
      )
    `),

    db.prepare(`
      CREATE TABLE IF NOT EXISTS blocks (
        blocker_id TEXT NOT NULL,
        blocked_id TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        PRIMARY KEY (blocker_id, blocked_id)
      )
    `),
  ]);
}

function validGender(value: string) {
  return value === "male" ||
    value === "female" ||
    value === "neutral";
}

function validAge(value: unknown) {
  const age = Number(value);
  return Number.isInteger(age) && age >= 13 && age <= 100;
}

async function getUsers(request: Request, env: Env) {
  await ensureDatabase(env.DB);

  const url = new URL(request.url);

  const country = url.searchParams.get("country") || "";
  const state = url.searchParams.get("state") || "";
  const gender = url.searchParams.get("gender") || "";

  const params: string[] = [];
  const where: string[] = [];

  if (country) {
    where.push("country = ?");
    params.push(country);
  }

  if (state) {
    where.push("state = ?");
    params.push(state);
  }

  if (validGender(gender)) {
    where.push("gender = ?");
    params.push(gender);
  }

  const query = `
    SELECT
      id,
      username,
      age,
      country,
      state,
      gender,
      avatar,
      last_seen
    FROM users
    ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
    ORDER BY last_seen DESC
    LIMIT 100
  `;

  const result = await env.DB
    .prepare(query)
    .bind(...params)
    .all();

  return json({
    users: result.results,
  });
}

async function register(request: Request, env: Env) {
  await ensureDatabase(env.DB);

  const body = await request.json() as {
    username?: string;
    password?: string;
    age?: number;
    country?: string;
    state?: string;
    gender?: string;
    avatar?: string;
  };

  const username = body.username?.trim() || "";
  const password = body.password || "";

  if (username.length < 3 || username.length > 24) {
    return json({ error: "Username must be 3-24 characters." }, 400);
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return json({
      error: "Username can contain only letters, numbers and _.",
    }, 400);
  }

  if (password && password.length < 6) {
    return json({
      error: "Password must be at least 6 characters.",
    }, 400);
  }

  if (!validAge(body.age)) {
    return json({ error: "Invalid age." }, 400);
  }

  if (!body.country || !body.state || !body.gender) {
    return json({
      error: "Country, state and gender are required.",
    }, 400);
  }

  if (!validGender(body.gender)) {
    return json({ error: "Invalid gender." }, 400);
  }

  const existing = await env.DB
    .prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE")
    .bind(username)
    .first();

  if (existing) {
    return json({
      error: "Username already exists.",
    }, 409);
  }

  const id = randomId();

  const avatar =
    body.avatar ||
    (body.gender === "female"
      ? "female-1"
      : body.gender === "male"
        ? "male-1"
        : "neutral-1");

  const passwordHash = password
    ? await hashPassword(password)
    : null;

  const now = Date.now();

  await env.DB
    .prepare(`
      INSERT INTO users
      (id, username, password_hash, age, country, state, gender, avatar, created_at, last_seen)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      id,
      username,
      passwordHash,
      body.age,
      body.country,
      body.state,
      body.gender,
      avatar,
      now,
      now,
    )
    .run();

  return json({
    user: {
      id,
      username,
      age: body.age,
      country: body.country,
      state: body.state,
      gender: body.gender,
      avatar,
    },
  }, 201);
}

async function login(request: Request, env: Env) {
  await ensureDatabase(env.DB);

  const body = await request.json() as {
    username?: string;
    password?: string;
  };

  const username = body.username?.trim() || "";
  const password = body.password || "";

  const user = await env.DB
    .prepare(`
      SELECT *
      FROM users
      WHERE username = ? COLLATE NOCASE
    `)
    .bind(username)
    .first<{
      id: string;
      username: string;
      password_hash: string | null;
      age: number;
      country: string;
      state: string;
      gender: string;
      avatar: string;
    }>();

  if (!user || !user.password_hash) {
    return json({
      error: "Invalid username or password.",
    }, 401);
  }

  const passwordHash = await hashPassword(password);

  if (passwordHash !== user.password_hash) {
    return json({
      error: "Invalid username or password.",
    }, 401);
  }

  await env.DB
    .prepare("UPDATE users SET last_seen = ? WHERE id = ?")
    .bind(Date.now(), user.id)
    .run();

  return json({
    user: {
      id: user.id,
      username: user.username,
      age: user.age,
      country: user.country,
      state: user.state,
      gender: user.gender,
      avatar: user.avatar,
    },
  });
}

async function blockUser(request: Request, env: Env) {
  await ensureDatabase(env.DB);

  const body = await request.json() as {
    blockerId?: string;
    blockedId?: string;
  };

  if (!body.blockerId || !body.blockedId) {
    return json({ error: "Missing user IDs." }, 400);
  }

  if (body.blockerId === body.blockedId) {
    return json({ error: "You cannot block yourself." }, 400);
  }

  await env.DB
    .prepare(`
      INSERT OR IGNORE INTO blocks
      (blocker_id, blocked_id, created_at)
      VALUES (?, ?, ?)
    `)
    .bind(
      body.blockerId,
      body.blockedId,
      Date.now(),
    )
    .run();

  return json({ success: true });
}

async function api(request: Request, env: Env) {
  const url = new URL(request.url);

  if (request.method === "POST" && url.pathname === "/api/register") {
    return register(request, env);
  }

  if (request.method === "POST" && url.pathname === "/api/login") {
    return login(request, env);
  }

  if (request.method === "GET" && url.pathname === "/api/users") {
    return getUsers(request, env);
  }

  if (request.method === "POST" && url.pathname === "/api/block") {
    return blockUser(request, env);
  }

  return null;
}

export default {
  async fetch(request, env) {
    const apiResponse = await api(request, env);

    if (apiResponse) {
      return apiResponse;
    }

    return (
      (await routePartykitRequest(request, { ...env })) ||
      env.ASSETS.fetch(request)
    );
  },
} satisfies ExportedHandler<Env>;
