import type { Metadata } from "next";
import ChatRoom from "./chat-room";

export const metadata: Metadata = {
	title: "Chat | Don Araiのサイト",
};

export default function ChatPage() {
	return (
		<main className="max-w-3xl mx-auto px-6 py-16 fade-in">
			<h1 className="text-3xl font-bold mb-2">Chat</h1>
			<p className="text-zinc-500 mb-12">
				サイトに来た人同士で気軽に話せる場所です
			</p>
			<ChatRoom />
		</main>
	);
}
