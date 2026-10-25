import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from "jose";

// Cloudflare Access が付ける署名付きトークン（JWT）を検証する。
// Access の設定を誤って外してしまっても、ここで検証している限り管理機能は開かない。
// 参考: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/

export type AccessConfig = {
	teamDomain: string; // https://<チーム名>.cloudflareaccess.com
	audience: string; // Access アプリケーションの AUD タグ
	adminEmails: string[];
};

type AccessEnv = {
	TEAM_DOMAIN?: string;
	POLICY_AUD?: string;
	ADMIN_EMAILS?: string;
};

// 設定が1つでも欠けていたら null を返し、管理機能を使えなくする
export function readAccessConfig(env: AccessEnv): AccessConfig | null {
	const team = env.TEAM_DOMAIN?.trim().replace(/\/+$/, "");
	const audience = env.POLICY_AUD?.trim();
	const adminEmails = (env.ADMIN_EMAILS ?? "")
		.split(",")
		.map((email) => email.trim().toLowerCase())
		.filter(Boolean);
	if (!team || !audience || adminEmails.length === 0) return null;
	const teamDomain = team.startsWith("https://") ? team : `https://${team}`;
	return { teamDomain, audience, adminEmails };
}

// 公開鍵の取得結果は jose がキャッシュするので、チームごとに1つだけ作って使い回す
const jwksCache = new Map<string, JWTVerifyGetKey>();

function remoteJwks(teamDomain: string): JWTVerifyGetKey {
	let jwks = jwksCache.get(teamDomain);
	if (!jwks) {
		jwks = createRemoteJWKSet(new URL(`${teamDomain}/cdn-cgi/access/certs`));
		jwksCache.set(teamDomain, jwks);
	}
	return jwks;
}

// 署名、発行元、宛先、有効期限がすべて正しく、
// しかも管理者として登録したメールアドレスなら、そのアドレスを返す
export async function verifyAdminToken(
	token: string | null,
	config: AccessConfig,
	jwks: JWTVerifyGetKey = remoteJwks(config.teamDomain),
): Promise<string | null> {
	if (!token) return null;
	try {
		const { payload } = await jwtVerify(token, jwks, {
			issuer: config.teamDomain,
			audience: config.audience,
			// Access は RS256 で署名する。ほかの方式を受け付けないよう固定する
			algorithms: ["RS256"],
		});
		const email = typeof payload.email === "string" ? payload.email.toLowerCase() : "";
		return config.adminEmails.includes(email) ? email : null;
	} catch {
		return null;
	}
}
