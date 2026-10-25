// Worker と Durable Object の両方で使う、HTTP と WebSocket の小さな道具

// WebSocket の終了コード。規則違反による切断を表す
export const POLICY_VIOLATION = 1008;

// 接続をいったん受け付けてから、理由を付けて閉じる。
// こうするとブラウザは close イベントで理由を受け取れ、再接続をやめられる
export function rejectConnection(reason: string): Response {
	const [client, server] = Object.values(new WebSocketPair());
	server.accept();
	server.close(POLICY_VIOLATION, reason);
	return new Response(null, { status: 101, webSocket: client });
}

// 他のサイトのページから送られたリクエストではないかを確かめる
export function isSameOrigin(request: Request): boolean {
	const origin = request.headers.get("Origin");
	if (!origin) return false;
	try {
		return new URL(origin).host === new URL(request.url).host;
	} catch {
		return false;
	}
}

export function json(data: unknown, status = 200): Response {
	return Response.json(data, {
		status,
		headers: { "Cache-Control": "no-store" },
	});
}
