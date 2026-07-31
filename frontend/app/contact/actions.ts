"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";

const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

function formatTokyoTime(date: Date): string {
	const parts = new Intl.DateTimeFormat("ja-JP", {
		timeZone: "Asia/Tokyo",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(date);
	const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
	return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}`;
}

export async function sendContactEmail(formData: FormData) {
	const name = (formData.get("name") as string).trim();
	const email = (formData.get("email") as string).trim();
	const message = (formData.get("message") as string).trim();

	if (!name || name.length > 100) throw new Error("名前が不正です");
	if (!email || email.length > 200 || !emailRegex.test(email))
		throw new Error("メールアドレスが不正です");
	if (!message || message.length > 5000) throw new Error("メッセージが不正です");

	const { env } = await getCloudflareContext({ async: true });
	const discordWebhookUrl = env.DISCORD_WEBHOOK_URL;
	if (!discordWebhookUrl) throw new Error("送信に失敗しました");

	const content =
		"📬 お問い合わせが届きました\n\n" +
		`📅 ${formatTokyoTime(new Date())}\n` +
		`👤 名前：${name}\n` +
		`📧 メール：${email}\n` +
		"💬 メッセージ：\n" +
		message;

	const res = await fetch(discordWebhookUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ content }),
	});

	if (!res.ok) {
		throw new Error("送信に失敗しました");
	}
}
