// 日時を日本時間の "YYYY-MM-DD HH:mm" で表示する
export function formatDateTime(value: string | number): string {
	const parts = new Intl.DateTimeFormat("ja-JP", {
		timeZone: "Asia/Tokyo",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(new Date(value));
	const get = (type: string) =>
		parts.find((p) => p.type === type)?.value ?? "";
	return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}
