import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextRequest, NextResponse } from "next/server";

type GitHubPushPayload = {
	repository?: {
		name?: string;
		private?: boolean;
	};
	compare?: string;
};

function toHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("");
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return mismatch === 0;
}

async function verifySignature(
	secret: string,
	payload: string,
	signature: string | null,
): Promise<boolean> {
	if (!signature) return false;

	const key = await crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const digest = await crypto.subtle.sign(
		"HMAC",
		key,
		new TextEncoder().encode(payload),
	);
	const expected = `sha256=${toHex(digest)}`;

	return timingSafeEqual(signature, expected);
}

export async function POST(request: NextRequest) {
	const { env } = await getCloudflareContext({ async: true });

	const payload = await request.text();
	const signature = request.headers.get("x-hub-signature-256");
	const deliveryId = request.headers.get("x-github-delivery");

	const isValid = await verifySignature(
		env.WEBHOOK_SECRET ?? "",
		payload,
		signature,
	);
	if (!isValid) {
		return NextResponse.json({ error: "invalid signature" }, { status: 401 });
	}

	const json: GitHubPushPayload = JSON.parse(payload);

	if (json.repository?.private) {
		return NextResponse.json({ ok: true });
	}

	if (deliveryId) {
		const existing = await env.DB.prepare(
			"SELECT id FROM push_events WHERE delivery_id = ?",
		)
			.bind(deliveryId)
			.first();
		if (existing) {
			return NextResponse.json({ ok: true });
		}
	}

	const repository = json.repository?.name ?? "unknown";
	const compareUrl = json.compare?.startsWith("https://github.com/")
		? json.compare
		: "";
	const receivedAt = new Date().toISOString();

	await env.DB.prepare(
		"INSERT INTO push_events (repository, received_at, compare_url, delivery_id) VALUES (?, ?, ?, ?)",
	)
		.bind(repository, receivedAt, compareUrl, deliveryId ?? null)
		.run();

	return NextResponse.json({ ok: true });
}
