import { DurableObject } from "cloudflare:workers";
import {
	MIN_SEND_INTERVAL_MS,
	OWNER_NAME,
	hasUnsupportedNameChars,
	isReservedName,
	normalizeName,
	normalizeText,
	type AdminResult,
	type AdminState,
	type ChatMessage,
	type ClientEvent,
	type ServerEvent,
} from "./chat-protocol";
import { POLICY_VIOLATION, rejectConnection } from "./http";
import { toIpKey } from "./ip";

// 部屋は1つだけなので、いつも同じ名前の Durable Object を使う
export const LOBBY = "lobby";

// 入室したときに送る過去ログの件数と、保存しておく最大件数
const HISTORY_SIZE = 50;
const KEEP_SIZE = 200;
// 同じ IP アドレスから同時に開ける接続の数と、1分間に接続し直せる回数
const MAX_CONNECTIONS_PER_IP = 5;
const MAX_CONNECTS_PER_MINUTE = 10;
// 受け付ける1メッセージの最大サイズ（JSON 全体の文字数）
const MAX_RAW_LENGTH = 4096;
// 1分間に違反がこの回数に達したら、自動で一定時間締め出す
const STRIKES_BEFORE_BAN = 10;
const AUTO_BAN_MS = 10 * 60_000;
const MINUTE_MS = 60_000;

// 接続ごとに覚えておく情報。休止しても消えないよう、WebSocket に添付して保存する
type Attachment = { name: string; ipKey: string };

// IP ごとの直近の行動。メモリにだけ置き、ストレージの書き込み回数を節約する。
// 休止すると消えるが、休止するのは誰も何もしていない間だけなので判定には影響しない
type Activity = { lastSentAt: number; connects: number[]; strikes: number[] };

type MessageRow = {
	id: number;
	name: string;
	text: string;
	sent_at: string;
	owner: number;
	ip_key: string;
};
type BanRow = { ip_key: string; until: number; reason: string };

/**
 * チャットルーム1部屋分の Durable Object。
 * 参加者全員の WebSocket 接続をこのオブジェクトが持ち、届いた発言を全員に配る。
 * Hibernation API を使っているので、誰も発言していない間は休止し、実行時間の課金が止まる。
 * このオブジェクトはインターネットから直接は呼べず、Worker の入口からだけ呼ばれる。
 */
export class ChatRoom extends DurableObject<CloudflareEnv> {
	private activity = new Map<string, Activity>();
	private lastSweepAt = 0;

	constructor(ctx: DurableObjectState, env: CloudflareEnv) {
		super(ctx, env);
		// 休止から起きるたびに呼ばれるので、ここには軽い処理だけを書く
		ctx.storage.sql.exec(`
			CREATE TABLE IF NOT EXISTS messages (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				text TEXT NOT NULL,
				sent_at TEXT NOT NULL,
				owner INTEGER NOT NULL DEFAULT 0,
				ip_key TEXT NOT NULL DEFAULT ''
			)
		`);
		ctx.storage.sql.exec(`
			CREATE TABLE IF NOT EXISTS bans (
				ip_key TEXT PRIMARY KEY,
				until INTEGER NOT NULL,
				reason TEXT NOT NULL
			)
		`);
		// ブラウザが接続維持のために送る "ping" には、休止したまま "pong" を返す
		ctx.setWebSocketAutoResponse(
			new WebSocketRequestResponsePair("ping", "pong"),
		);
	}

	// 新しい接続を受け付ける
	async fetch(request: Request): Promise<Response> {
		if (this.env.CHAT_DISABLED === "true") {
			return rejectConnection("チャットは現在停止中です");
		}

		const ipKey = toIpKey(request.headers.get("CF-Connecting-IP"));
		const now = Date.now();

		const ban = this.activeBan(ipKey, now);
		if (ban) return rejectConnection(banMessage(ban.until - now));

		this.forgetIdleActivity(now);
		const activity = this.activityOf(ipKey, now);
		if (activity.connects.length >= MAX_CONNECTS_PER_MINUTE) {
			this.addStrike(ipKey, now);
			return rejectConnection("接続のやり直しが多すぎます");
		}
		activity.connects.push(now);

		const name = normalizeName(new URL(request.url).searchParams.get("name"));
		if (!name) return rejectConnection("名前が不正です");
		if (hasUnsupportedNameChars(name)) return rejectConnection("名前に使えない文字が含まれています");
		if (isReservedName(name)) return rejectConnection("その名前は使えません");

		// タグに IP を付けておくと、getWebSockets(ipKey) で同じ人の接続だけを取り出せる
		if (this.ctx.getWebSockets(ipKey).length >= MAX_CONNECTIONS_PER_IP) {
			return rejectConnection("同時接続数の上限に達しています");
		}

		const [client, server] = Object.values(new WebSocketPair());
		this.ctx.acceptWebSocket(server, [ipKey]);
		server.serializeAttachment({ name, ipKey } satisfies Attachment);

		send(server, { type: "history", messages: this.recentMessages() });
		this.broadcastPresence();

		return new Response(null, { status: 101, webSocket: client });
	}

	// 参加者からメッセージが届いたときに呼ばれる
	async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
		const { name, ipKey } = ws.deserializeAttachment() as Attachment;
		const now = Date.now();

		if (this.env.CHAT_DISABLED === "true") {
			ws.close(POLICY_VIOLATION, "チャットは現在停止中です");
			return;
		}

		// 正規の画面からは送られてこないデータ。すぐに切断する
		if (typeof raw !== "string" || raw.length > MAX_RAW_LENGTH) {
			this.disconnectForAbuse(ws, ipKey, now);
			return;
		}
		const event = parseClientEvent(raw);
		if (!event) {
			this.disconnectForAbuse(ws, ipKey, now);
			return;
		}

		// 連投の判定は接続ごとではなく IP ごと。接続し直しても間隔はリセットされない
		const activity = this.activityOf(ipKey, now);
		if (now - activity.lastSentAt < MIN_SEND_INTERVAL_MS) {
			send(ws, { type: "error", error: "連続投稿は少し間をあけてください" });
			this.addStrike(ipKey, now);
			return;
		}

		const text = normalizeText(event.text);
		if (!text) {
			send(ws, { type: "error", error: "送信できない内容です" });
			this.addStrike(ipKey, now);
			return;
		}

		activity.lastSentAt = now;
		this.saveAndBroadcast({ name, text, owner: false, ipKey }, now);
	}

	// 参加者が抜けたときに呼ばれる。
	// 互換性日付が 2026-04-07 以降なので、切断への応答はランタイムが自動で返す
	async webSocketClose(ws: WebSocket) {
		this.broadcastPresence(ws);
	}

	async webSocketError(ws: WebSocket) {
		this.broadcastPresence(ws);
	}

	// ---- ここから下は管理画面用。Worker の入口で管理者だと確認してから呼ばれる ----

	adminState(): AdminState {
		const now = Date.now();
		this.ctx.storage.sql.exec("DELETE FROM bans WHERE until <= ?", now);
		const messages = this.ctx.storage.sql
			.exec<MessageRow>(
				"SELECT id, name, text, sent_at, owner, ip_key FROM messages ORDER BY id DESC",
			)
			.toArray()
			.map((row) => ({ ...toChatMessage(row), ipKey: row.ip_key }));
		const bans = this.ctx.storage.sql
			.exec<BanRow>("SELECT ip_key, until, reason FROM bans ORDER BY until DESC")
			.toArray()
			.map((row) => ({ ipKey: row.ip_key, until: row.until, reason: row.reason }));
		return { messages, bans, online: this.openSockets().length };
	}

	adminPost(value: string): AdminResult {
		const text = normalizeText(value);
		if (!text) return { ok: false, error: "送信できない内容です" };
		this.saveAndBroadcast({ name: OWNER_NAME, text, owner: true, ipKey: "" }, Date.now());
		return { ok: true };
	}

	adminDelete(id: number): AdminResult {
		const deleted = this.ctx.storage.sql
			.exec("DELETE FROM messages WHERE id = ? RETURNING id", id)
			.toArray();
		if (deleted.length === 0) return { ok: false, error: "発言が見つかりません" };
		this.broadcast({ type: "delete", id });
		return { ok: true };
	}

	adminBan(messageId: number, minutes: number): AdminResult {
		const [row] = this.ctx.storage.sql
			.exec<{ ip_key: string; owner: number }>(
				"SELECT ip_key, owner FROM messages WHERE id = ?",
				messageId,
			)
			.toArray();
		if (!row) return { ok: false, error: "発言が見つかりません" };
		if (row.owner || !row.ip_key) {
			return { ok: false, error: "この発言の投稿者は締め出せません" };
		}
		this.ban(row.ip_key, Date.now() + minutes * MINUTE_MS, "管理者による締め出し");
		return { ok: true };
	}

	adminUnban(ipKey: string): AdminResult {
		this.ctx.storage.sql.exec("DELETE FROM bans WHERE ip_key = ?", ipKey);
		this.activity.delete(ipKey);
		return { ok: true };
	}

	adminReset(): AdminResult {
		this.ctx.storage.sql.exec("DELETE FROM messages");
		this.broadcast({ type: "reset" });
		return { ok: true };
	}

	// ---- 内部の処理 ----

	private saveAndBroadcast(
		message: { name: string; text: string; owner: boolean; ipKey: string },
		now: number,
	) {
		const sentAt = new Date(now).toISOString();
		const { id } = this.ctx.storage.sql
			.exec<{ id: number }>(
				"INSERT INTO messages (name, text, sent_at, owner, ip_key) VALUES (?, ?, ?, ?, ?) RETURNING id",
				message.name,
				message.text,
				sentAt,
				message.owner ? 1 : 0,
				message.ipKey,
			)
			.one();
		// 古い発言を消して、保存量が増え続けないようにする
		this.ctx.storage.sql.exec("DELETE FROM messages WHERE id <= ?", id - KEEP_SIZE);

		this.broadcast({
			type: "message",
			message: { id, name: message.name, text: message.text, sentAt, owner: message.owner },
		});
	}

	private recentMessages(): ChatMessage[] {
		return this.ctx.storage.sql
			.exec<MessageRow>(
				"SELECT id, name, text, sent_at, owner, ip_key FROM messages ORDER BY id DESC LIMIT ?",
				HISTORY_SIZE,
			)
			.toArray()
			.reverse()
			.map(toChatMessage);
	}

	// IP ごとの行動記録を取り出す。1分より古い記録はここで捨てる
	private activityOf(ipKey: string, now: number): Activity {
		let activity = this.activity.get(ipKey);
		if (!activity) {
			activity = { lastSentAt: 0, connects: [], strikes: [] };
			this.activity.set(ipKey, activity);
		}
		activity.connects = activity.connects.filter((t) => now - t < MINUTE_MS);
		activity.strikes = activity.strikes.filter((t) => now - t < MINUTE_MS);
		return activity;
	}

	// 1分以上動きのない IP の記録を捨てる。捨てずにおくと、休止するまでの間
	// 訪れた IP の数だけメモリが増え続け、IP を変えながら接続されると上限に達しうる
	private forgetIdleActivity(now: number) {
		if (now - this.lastSweepAt < MINUTE_MS) return;
		this.lastSweepAt = now;
		for (const [ipKey, activity] of this.activity) {
			const lastSeenAt = Math.max(
				activity.lastSentAt,
				activity.connects.at(-1) ?? 0,
				activity.strikes.at(-1) ?? 0,
			);
			if (now - lastSeenAt >= MINUTE_MS) this.activity.delete(ipKey);
		}
	}

	// 違反を1回数える。1分間に一定回数を超えたら自動で締め出す
	private addStrike(ipKey: string, now: number) {
		const activity = this.activityOf(ipKey, now);
		activity.strikes.push(now);
		if (activity.strikes.length >= STRIKES_BEFORE_BAN) {
			activity.strikes = [];
			this.ban(ipKey, now + AUTO_BAN_MS, "違反の繰り返しによる自動の締め出し");
		}
	}

	private disconnectForAbuse(ws: WebSocket, ipKey: string, now: number) {
		this.addStrike(ipKey, now);
		ws.close(POLICY_VIOLATION, "不正なデータを受信したため切断しました");
	}

	// 締め出しは保存しておき、休止や再起動のあとも有効にする
	private ban(ipKey: string, until: number, reason: string) {
		this.ctx.storage.sql.exec(
			`INSERT INTO bans (ip_key, until, reason) VALUES (?, ?, ?)
			 ON CONFLICT (ip_key) DO UPDATE SET until = excluded.until, reason = excluded.reason`,
			ipKey,
			until,
			reason,
		);
		for (const ws of this.ctx.getWebSockets(ipKey)) {
			ws.close(POLICY_VIOLATION, "参加が制限されました");
		}
		this.broadcastPresence();
	}

	private activeBan(ipKey: string, now: number): BanRow | null {
		const [row] = this.ctx.storage.sql
			.exec<BanRow>("SELECT ip_key, until, reason FROM bans WHERE ip_key = ?", ipKey)
			.toArray();
		if (!row) return null;
		if (row.until <= now) {
			this.ctx.storage.sql.exec("DELETE FROM bans WHERE ip_key = ?", ipKey);
			return null;
		}
		return row;
	}

	// 開いている接続の一覧。切断処理中の接続は除く
	private openSockets(closing?: WebSocket): WebSocket[] {
		return this.ctx
			.getWebSockets()
			.filter((ws) => ws !== closing && ws.readyState === WebSocket.OPEN);
	}

	private broadcast(event: ServerEvent) {
		for (const ws of this.openSockets()) send(ws, event);
	}

	// 今いる人数を全員に知らせる
	private broadcastPresence(closing?: WebSocket) {
		const sockets = this.openSockets(closing);
		for (const ws of sockets) send(ws, { type: "presence", online: sockets.length });
	}
}

function toChatMessage(row: MessageRow): ChatMessage {
	return {
		id: row.id,
		name: row.name,
		text: row.text,
		sentAt: row.sent_at,
		owner: row.owner === 1,
	};
}

function parseClientEvent(raw: string): ClientEvent | null {
	let value: unknown;
	try {
		value = JSON.parse(raw);
	} catch {
		return null;
	}
	if (typeof value !== "object" || value === null) return null;
	const event = value as Record<string, unknown>;
	if (event.type !== "message" || typeof event.text !== "string") return null;
	return { type: "message", text: event.text };
}

function send(ws: WebSocket, event: ServerEvent) {
	try {
		ws.send(JSON.stringify(event));
	} catch {
		// 相手がすでに切断していたら何もしない
	}
}

// 締め出しの残り時間を、ブラウザに伝える文に直す
function banMessage(remainingMs: number): string {
	const minutes = Math.ceil(remainingMs / MINUTE_MS);
	const wait =
		minutes < 60
			? `${minutes}分`
			: minutes < 48 * 60
				? `${Math.ceil(minutes / 60)}時間`
				: `${Math.ceil(minutes / (24 * 60))}日`;
	return `参加が制限されています。あと約${wait}お待ちください`;
}
