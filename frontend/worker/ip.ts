// 回数制限や締め出しで「同じ人」とみなす単位を、IP アドレスから作る。
// IPv4 はアドレスそのものを使う。
// IPv6 は1つの回線に先頭64ビット分のアドレスがまとめて割り当てられるのが普通で、
// 1人でも大量のアドレスを使い分けられる。そのため先頭64ビットでまとめる。
export function toIpKey(ip: string | null | undefined): string {
	if (!ip) return "unknown";
	const address = ip.trim().toLowerCase();
	if (!address.includes(":")) return address;

	// IPv4 アドレスを IPv6 の形で書いたものは、IPv4 として扱う
	const mapped = address.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
	if (mapped) return mapped[1];

	const groups = expandIpv6(address);
	if (!groups) return address;
	return `${groups.slice(0, 4).join(":")}::/64`;
}

// "2001:db8::1" のような省略形を、8つの区切りに展開する
function expandIpv6(address: string): string[] | null {
	const halves = address.split("::");
	if (halves.length > 2) return null;
	const head = halves[0] ? halves[0].split(":") : [];
	const tail = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
	const missing = 8 - head.length - tail.length;
	if (halves.length === 1 ? missing !== 0 : missing < 1) return null;

	const groups = [...head, ...Array<string>(missing).fill("0"), ...tail];
	if (!groups.every((group) => /^[0-9a-f]{1,4}$/.test(group))) return null;
	return groups.map((group) => parseInt(group, 16).toString(16));
}
