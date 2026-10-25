import type { Metadata } from "next";
import AdminPanel from "./admin-panel";

export const metadata: Metadata = {
	title: "Chat 管理 | Don Araiのサイト",
	robots: { index: false, follow: false },
};

// このページと管理 API は Cloudflare Access で守る。
// ページ自体は誰かに見られても、API がトークンを検証するので操作はできない
export default function AdminChatPage() {
	return (
		<main className="max-w-3xl mx-auto px-6 py-16 fade-in">
			<h1 className="text-3xl font-bold mb-2">Chat 管理</h1>
			<p className="text-zinc-500 mb-12">発言の削除や締め出しができます</p>
			<AdminPanel />
		</main>
	);
}
