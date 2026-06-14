"use client";

import { useState } from "react";
import { sendContactEmail } from "./actions";

export default function ContactPage() {
	const [sent, setSent] = useState(false);

	async function handleSubmit(formData: FormData) {
		await sendContactEmail(formData);
		setSent(true);
	}

	if (sent) {
		return (
			<main className="max-w-2xl mx-auto px-6 py-16 fade-in">
				<h1 className="text-3xl font-bold mb-2">送信完了</h1>
				<p className="text-zinc-500">
					お問い合わせありがとうございます。内容を確認次第、ご連絡いたします。
				</p>
			</main>
		);
	}

	return (
		<main className="max-w-2xl mx-auto px-6 py-16 fade-in">
			<h1 className="text-3xl font-bold mb-2">お問い合わせ</h1>
			<p className="text-zinc-500 mb-12">お気軽にご連絡ください。</p>

			<form action={handleSubmit} className="space-y-6">
				<div>
					<label className="block text-sm font-medium text-zinc-700 mb-1">
						お名前
					</label>
					<input
						type="text"
						name="name"
						required
						className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-zinc-700 mb-1">
						メールアドレス
					</label>
					<input
						type="email"
						name="email"
						required
						className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
					/>
				</div>

				<div>
					<label className="block text-sm font-medium text-zinc-700 mb-1">
						メッセージ
					</label>
					<textarea
						name="message"
						required
						rows={6}
						className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
					/>
				</div>

				<button
					type="submit"
					className="px-6 py-2 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 transition-colors"
				>
					送信する
				</button>
			</form>
		</main>
	);
}
