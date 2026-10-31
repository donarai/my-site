import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

// ビルド時に作ったページを静的アセットに置き、アクセスのたびに作り直さずにそのまま返す。
// 読み取り専用なので、ページを一定時間ごとに作り直す再検証（ISR）は使えない。
// 中身が変わるのはデプロイしたときだけ
// See https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig({
	incrementalCache: staticAssetsIncrementalCache,
	// キャッシュにあるページは Next.js の処理を起動せずに返し、CPU とメモリを節約する
	enableCacheInterception: true,
});
