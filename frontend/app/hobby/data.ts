export type HobbyCategory = "お笑い" | "音楽";

export type HobbyEvent = {
	date: string; // YYYY-MM-DD
	category: HobbyCategory;
	event: string;
	location?: string;
	link?: string;
	comment?: string;
	acts?: string[]; // 出演者・アーティスト一覧。先頭(acts[0])が目当ての人
};

// 表示側で日付順に並び替える
export const hobbyEvents: HobbyEvent[] = [
	{
		date: "2026-07-26",
		category: "お笑い",
		event: "よしもと粗品劇場",
		location: "渋谷よしもと漫才劇場",
		link: "https://x.com/shibuya_mngk/status/2081212913042223133",
		acts: ["粗品", "カベポスター", "例えば炎", "ド桜"],
	},
	{
		date: "2026-07-22",
		category: "お笑い",
		event: "電池の切れかけた蟹46",
		location: "ルミネtheよしもと",
		link: "https://x.com/lumineyoshimoto/status/2079739782989775054",
		acts: ["粗品"],
	},
	{
		date: "2026-06-21",
		category: "お笑い",
		event: "よしもと粗品劇場",
		location: "渋谷よしもと漫才劇場",
		link: "https://x.com/shibuya_mngk/status/2068604272116429249",
		acts: ["粗品", "めぞん", "ゼロカラン", "三遊間"],
	},
	{
		date: "2026-07-16",
		category: "お笑い",
		event: "せいやのお笑いライブvol.50",
		location: "ルミネtheよしもと",
		link: "https://x.com/lumineyoshimoto/status/2077564509095641214",
		acts: ["せいや"],
	},
	{
		date: "2026-07-17",
		category: "音楽",
		event: "PK shampoo tour 2026 -Planet Parade-",
		location: "Zepp DiverCity (TOKYO)",
		link: "https://pkshampoo.jp/event/%e5%85%a8%e5%9b%bd%e3%83%84%e3%82%a2%e3%83%bc%e3%80%90%e6%9d%b1%e4%ba%ac%e3%80%91%e3%80%8cpk-shampoo-tour-2026-planet-parade-%e3%80%8d/",
		acts: ["PK shampoo"],
	},
	{
		date: "2026-06-16",
		category: "お笑い",
		event: "せいやのお笑いライブvol.49",
		location: "ルミネtheよしもと",
		link: "https://x.com/lumineyoshimoto/status/2066690483666276417",
		acts: ["せいや"],
	},
	{
		date: "2026-05-26",
		category: "お笑い",
		event: "電池の切れかけた蟹44〜企画編〜",
		location: "ルミネtheよしもと",
		link: "https://x.com/lumineyoshimoto/status/2059085248252854325",
		acts: ["粗品"],
	},
	{
		date: "2026-06-06",
		category: "音楽",
		event: "ヤマトパンクス弾き語りミニライブ",
		location: "タワーレコード渋谷店",
		link: "https://x.com/PKshampoo/status/2063234520267227639",
		comment: "『尊い偽星』発売記念イベント",
		acts: ["ヤマトパンクス"],
	},
	{
		date: "2026-05-19",
		category: "お笑い",
		event: "せいやのお笑いライブvol.48",
		location: "ルミネtheよしもと",
		link: "https://x.com/lumineyoshimoto/status/2056547616553664794",
		acts: ["せいや"],
	},
	{
		date: "2026-05-06",
		category: "音楽",
		event: "イニミニ",
		location: "Zepp Shinjuku (TOKYO)",
		link: "https://wmg.jp/seiyaishikawa/news/90742",
		comment: "石川晟也、初音楽ライブ",
		acts: ["せいや"],
	},
	{
		date: "2026-04-23",
		category: "音楽",
		event: "From World Wide Web pre.「FIRE WALL Vol.3」",
		location: "川崎CLUB CITTA’ ",
		link: "https://pkshampoo.jp/event/from-world-wide-web-pre-%e3%80%8cfire-wall-vol-3%e3%80%8d-2/",
		acts: ["PK shampoo", "DOES"],
	},
	{
		date: "2026-04-22",
		category: "お笑い",
		event: "電池の切れかけた蟹43〜ネタ編〜",
		location: "ルミネtheよしもと",
		link: "https://x.com/lumineyoshimoto/status/2046761838373900552",
		acts: ["粗品"],
	},
	{
		date: "2026-04-21",
		category: "お笑い",
		event: "せいやのお笑いライブvol.47",
		location: "ルミネtheよしもと",
		link: "https://x.com/lumineyoshimoto/status/2046411557106807219",
		acts: ["せいや"],
	},
];
