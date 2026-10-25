// Worker の入口。OpenNext が生成する Next.js の Worker の手前に置く。
// Next.js のルートハンドラーは WebSocket を扱えないので、
// チャットの接続と管理 API だけをここで受け、それ以外は Next.js に渡す。
// 参考: https://opennext.js.org/cloudflare/howtos/custom-worker

// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- ビルド前はファイルが存在しないため
// @ts-ignore `.open-next/worker.js` は opennextjs-cloudflare build で生成される
import { default as handler } from "../.open-next/worker.js";
import { handleAdmin } from "./admin";
import { ADMIN_API_PREFIX, CHAT_WS_PATH } from "./chat-protocol";
import { LOBBY } from "./chat-room";
import { isSameOrigin, rejectConnection } from "./http";

export { ChatRoom } from "./chat-room";

const worker = {
	async fetch(request, env, ctx) {
		const { pathname } = new URL(request.url);
		if (pathname === CHAT_WS_PATH) {
			return handleChat(request, env);
		}
		if (pathname === ADMIN_API_PREFIX || pathname.startsWith(`${ADMIN_API_PREFIX}/`)) {
			return handleAdmin(request, env);
		}
		return handler.fetch(request, env, ctx);
	},
} satisfies ExportedHandler<CloudflareEnv>;

export default worker;

function handleChat(request: Request, env: CloudflareEnv): Promise<Response> | Response {
	if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
		return new Response("Expected WebSocket", { status: 426 });
	}
	// 他のサイトのページから勝手に接続されないよう、同じオリジンからの接続だけを通す
	if (!isSameOrigin(request)) {
		return new Response("Forbidden", { status: 403 });
	}
	// 緊急停止スイッチ。Durable Object に届く前に断るので、攻撃を受けていても負荷がかからない
	if (env.CHAT_DISABLED === "true") {
		return rejectConnection("チャットは現在停止中です");
	}
	return env.CHAT_ROOM.getByName(LOBBY).fetch(request);
}
