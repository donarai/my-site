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
	/[\p{Cc}\p{Cf}\p{Co}\p{Zl}\p{Zp}\u115F\u1160\u3164\uFFA0\u2800]/gu;
// 本文では、絵文字どうしをつなぐゼロ幅接合子 U+200D だけは残す。
// それ以外の位置にあるものは、結合文字の間に挟んで重ね数の制限をすり抜けるのに使われる
const INVISIBLE_EXCEPT_EMOJI_ZWJ =
	/(?!\u200D)[\p{Cc}\p{Cf}\p{Co}\p{Zl}\p{Zp}\u115F\u1160\u3164\uFFA0\u2800]|(?<![\p{Extended_Pictographic}\uFE0F\u{1F3FB}-\u{1F3FF}])\u200D|\u200D(?!\p{Extended_Pictographic})/gu;
// 結合文字を何重にも重ねて表示を崩す荒らし対策。3つ目以降を捨てる
const STACKED_MARKS = /(\p{M}{2})\p{M}+/gu;
const SPACES = /\s+/gu;

// 画面上で1文字として扱われるまとまり（書記素クラスタ）の長さの上限。
// 肌の色の指定や結合文字をつなげ続けると、折り返せない巨大な1文字になって枠からはみ出す。
// 肌の色付きの2人組の絵文字のような長いものでも 10 なので、少し余裕を持たせる
const MAX_CLUSTER_LENGTH = 12;
const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

function hasHugeCluster(value: string): boolean {
	for (const { segment } of graphemes.segment(value)) {
		if ([...segment].length > MAX_CLUSTER_LENGTH) return true;
	}
	return false;
}

// 上限ができる前に投稿された巨大な1文字は、保存済みの発言に残っている。
// CSS では1文字の途中で折り返せないので、表示するときは一定の長さごとに区切り、
// 区切りの間に <wbr> を置いて折り返せるようにする
export function splitHugeClusters(text: string): string[] {
	const parts: string[] = [];
	let current = "";
	for (const { segment } of graphemes.segment(text)) {
		const chars = [...segment];
		if (chars.length <= MAX_CLUSTER_LENGTH) {
			current += segment;
			continue;
		}
		for (let i = 0; i < chars.length; i += MAX_CLUSTER_LENGTH) {
			current += chars.slice(i, i + MAX_CLUSTER_LENGTH).join("");
			parts.push(current);
			current = "";
		}
	}
	if (current) parts.push(current);
	return parts;
}

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
	if (hasHugeCluster(name)) return null;
	return name;
}

export function normalizeText(value: unknown): string | null {
	if (typeof value !== "string") return null;
	// 本文は全角英数字をそのまま残したいので、NFC で合成文字だけをそろえる
	const text = clean(value.normalize("NFC"), INVISIBLE_EXCEPT_EMOJI_ZWJ);
	if (text.length === 0 || text.length > MAX_TEXT_LENGTH) return null;
	if (hasHugeCluster(text)) return null;
	return text;
}

// 名前に使える文字。英数字（アクセント付きのラテン文字を含む）、ひらがな、カタカナ、漢字と、
// どの言語でも使う記号や絵文字に限る。キリル文字やチェロキー文字のように
// アルファベットとそっくりな字を持つ文字体系で、本人になりすますのを防ぐ
const NAME_CHARS =
	/^(?:[ 0-9A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\p{scx=Hira}\p{scx=Kana}\p{scx=Hani}\p{M}]|(?=\p{scx=Zyyy})[\p{P}\p{S}])+$/u;

export function hasUnsupportedNameChars(name: string): boolean {
	return !NAME_CHARS.test(name);
}

// ラテン文字とそっくりなキリル文字やギリシャ文字などを、比べるときだけラテン文字に寄せる。
// すべては防げないので、本人の発言には別途「管理人」の印を付けている
const LOOKALIKES: Record<string, string> = {
	а: "a", е: "e", о: "o", р: "p", с: "c", у: "y", х: "x", і: "i", ј: "j",
	ԁ: "d", ո: "n", ɑ: "a", α: "a", ο: "o", ν: "v", ι: "i", ı: "i", "0": "o",
	ð: "d", ø: "o", "¡": "i", "|": "i",
};

// アクセントや記号、空白を除いて小文字にした、比較用の形
function nameSkeleton(name: string): string {
	// NFKD でアクセント付きの文字を「文字＋結合文字」に分け、結合文字のほうを捨てる
	return [...name.normalize("NFKD").toLowerCase()]
		.map((char) => LOOKALIKES[char] ?? char)
		.join("")
		// 濁点と半濁点は「じゅん」と「しゅん」を区別するのに要るので残す
		.replace(/(?![\u3099\u309A])[\p{M}\p{P}\p{S}\p{Z}\p{C}]/gu, "");
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
