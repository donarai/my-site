import { readAccessConfig, verifyAdminToken } from "./access";
import { ADMIN_API_PREFIX, type AdminResult } from "./chat-protocol";
import { LOBBY } from "./chat-room";
import { isSameOrigin, json } from "./http";

// 締め出しで選べる長さ。1時間、1日、30日
const BAN_MINUTES = new Set([60, 24 * 60, 30 * 24 * 60]);

// 管理画面から呼ばれる API。
// /admin 以下は Cloudflare Access で守り、さらにここでトークンを検証する二重の構えにしている
export async function handleAdmin(
	request: Request,
	env: CloudflareEnv,
): Promise<Response> {
	const config = readAccessConfig(env);
	if (!config) return json({ error: "管理機能が設定されていません" }, 403);

	const email = await verifyAdminToken(
		request.headers.get("Cf-Access-Jwt-Assertion"),
		config,
	);
	if (!email) return json({ error: "管理者として認証されていません" }, 403);

	const action = new URL(request.url).pathname.slice(ADMIN_API_PREFIX.length);
	const room = env.CHAT_ROOM.getByName(LOBBY);

	if (request.method === "GET" && action === "/state") {
		return json(await room.adminState());
	}

	if (request.method !== "POST") return json({ error: "許可されていない操作です" }, 405);

	// 管理者がログインしたブラウザに、ほかのサイトから操作を送り込ませる攻撃（CSRF）を防ぐ。
	// JSON での送信を必須にすると、ほかのサイトのフォームからは送れなくなる
	const contentType = request.headers.get("Content-Type") ?? "";
	if (!isSameOrigin(request) || !contentType.startsWith("application/json")) {
		return json({ error: "許可されていない送信元です" }, 403);
	}

	let body: Record<string, unknown>;
	try {
		const parsed: unknown = await request.json();
		if (typeof parsed !== "object" || parsed === null) throw new Error();
		body = parsed as Record<string, unknown>;
	} catch {
		return json({ error: "送信内容が不正です" }, 400);
	}

	switch (action) {
		case "/messages":
			return result(await room.adminPost(String(body.text ?? "")));
		case "/messages/delete": {
			const id = Number(body.id);
			if (!Number.isSafeInteger(id)) return json({ error: "発言の指定が不正です" }, 400);
			return result(await room.adminDelete(id));
		}
		case "/bans": {
			const messageId = Number(body.messageId);
			const minutes = Number(body.minutes);
			if (!Number.isSafeInteger(messageId) || !BAN_MINUTES.has(minutes)) {
				return json({ error: "締め出しの指定が不正です" }, 400);
			}
			return result(await room.adminBan(messageId, minutes));
		}
		case "/bans/delete": {
			const ipKey = body.ipKey;
			if (typeof ipKey !== "string" || ipKey.length === 0 || ipKey.length > 64) {
				return json({ error: "解除する対象が不正です" }, 400);
			}
			return result(await room.adminUnban(ipKey));
		}
		case "/reset":
			return result(await room.adminReset());
		default:
			return json({ error: "見つかりません" }, 404);
	}
}

function result(value: AdminResult): Response {
	return value.ok ? json(value) : json(value, 400);
}
