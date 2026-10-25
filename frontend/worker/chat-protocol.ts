// ブラウザと Durable Object の間でやり取りするメッセージの形と、入力の整え方。
// ブラウザ側からも import するので、Workers 専用の API はここでは使わない。

export const CHAT_WS_PATH = "/api/chat/ws";
export const ADMIN_API_PREFIX = "/admin/api/chat";
export const MAX_NAME_LENGTH = 20;
export const MAX_TEXT_LENGTH = 500;
// 同じ IP アドレスから続けて投稿できる最短の間隔
export const MIN_SEND_INTERVAL_MS = 1000;
// 管理画面から発言したときに表示する名前
export const OWNER_NAME = "Don Arai";

export type ChatMessage = {
	id: number;
	name: string;
	text: string;
	sentAt: string; // ISO 8601
	owner: boolean; // 管理画面から発言したものだけ true
};

// ブラウザからサーバーへ送るイベント
export type ClientEvent = { type: "message"; text: string };

// サーバーからブラウザへ送るイベント
export type ServerEvent =
	| { type: "history"; messages: ChatMessage[] }
	| { type: "message"; message: ChatMessage }
	| { type: "delete"; id: number }
	| { type: "reset" }
	| { type: "presence"; online: number }
	| { type: "error"; error: string };

// 管理画面だけが受け取るデータ
export type AdminMessage = ChatMessage & { ipKey: string };
export type BanInfo = { ipKey: string; until: number; reason: string };
export type AdminState = { messages: AdminMessage[]; bans: BanInfo[]; online: number };
export type AdminResult = { ok: true } | { ok: false; error: string };

// 画面に表示されない文字。ゼロ幅スペース、文字の向きを変える制御文字、
// 私用領域の文字、見た目が空白になるハングルの埋め字や点字の空白などを含む
const INVISIBLE =
	/[\p{Cc}\p{Cf}\p{Co}\p{Zl}\p{Zp}ᅟᅠㅤﾠ⠀]/gu;
// 本文では、絵文字の組み合わせに使うゼロ幅接合子 U+200D だけは残す
const INVISIBLE_EXCEPT_ZWJ =
	/(?!‍)[\p{Cc}\p{Cf}\p{Co}\p{Zl}\p{Zp}ᅟᅠㅤﾠ⠀]/gu;
// 結合文字を何重にも重ねて表示を崩す荒らし対策。3つ目以降を捨てる
const STACKED_MARKS = /(\p{M}{2})\p{M}+/gu;
const SPACES = /\s+/gu;

function clean(value: string, invisible: RegExp): string {
	return value
		// 改行やタブは先に空白へ置き換え、前後の文字がくっつかないようにする
		.replace(SPACES, " ")
		.replace(invisible, "")
		.replace(STACKED_MARKS, "$1")
		.replace(SPACES, " ")
		.trim();
}

export function normalizeName(value: unknown): string | null {
	if (typeof value !== "string") return null;
	// NFKC で全角英数字を半角にするなど、見た目が同じ文字を1つの形にそろえる
	const name = clean(value.normalize("NFKC"), INVISIBLE);
	if (name.length === 0 || name.length > MAX_NAME_LENGTH) return null;
	return name;
}

export function normalizeText(value: unknown): string | null {
	if (typeof value !== "string") return null;
	// 本文は全角英数字をそのまま残したいので、NFC で合成文字だけをそろえる
	const text = clean(value.normalize("NFC"), INVISIBLE_EXCEPT_ZWJ);
	if (text.length === 0 || text.length > MAX_TEXT_LENGTH) return null;
	return text;
}

// ラテン文字とそっくりなキリル文字やギリシャ文字などを、比べるときだけラテン文字に寄せる。
// すべては防げないので、本人の発言には別途「管理人」の印を付けている
const LOOKALIKES: Record<string, string> = {
	а: "a", е: "e", о: "o", р: "p", с: "c", у: "y", х: "x", і: "i", ј: "j",
	ԁ: "d", ո: "n", ɑ: "a", α: "a", ο: "o", ν: "v", ι: "i", ı: "i", "0": "o",
};

// 記号や空白を除いて小文字にした、比較用の形
function nameSkeleton(name: string): string {
	return [...name.normalize("NFKC").toLowerCase()]
		.map((char) => LOOKALIKES[char] ?? char)
		.join("")
		.replace(/[\p{P}\p{S}\p{Z}\p{C}]/gu, "");
}

// 名前のどこかに含まれていたら使えないもの
const RESERVED_PARTS = ["Don Arai", "Arai Don", "荒井 盾", "あらい じゅん", "アライ ジュン"].map(nameSkeleton);
// 名前全体がこれと同じなら使えないもの
const RESERVED_NAMES = [
	"admin", "administrator", "moderator", "owner", "system",
	"管理人", "管理者", "運営", "本人", "オーナー", "システム", "モデレーター",
].map(nameSkeleton);

export function isReservedName(name: string): boolean {
	const skeleton = nameSkeleton(name);
	return (
		RESERVED_PARTS.some((part) => skeleton.includes(part)) ||
		RESERVED_NAMES.includes(skeleton)
	);
}
