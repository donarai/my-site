interface CloudflareEnv {
	WEBHOOK_SECRET?: string;
	DISCORD_WEBHOOK_URL?: string;
	// "true" にすると、チャットへの接続と発言をすべて断る緊急停止スイッチ
	CHAT_DISABLED?: string;
	// 管理画面を守る Cloudflare Access の設定。どれか1つでも欠けると管理機能は使えない
	TEAM_DOMAIN?: string; // https://<チーム名>.cloudflareaccess.com
	POLICY_AUD?: string; // Access アプリケーションの AUD タグ
	ADMIN_EMAILS?: string; // 管理者のメールアドレス。複数ならカンマ区切り
}
