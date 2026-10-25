"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { sendContactEmail } from "./actions";

export default function ContactPage() {
	const router = useRouter();
	const [emailError, setEmailError] = useState("");

	const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

	function handleEmailBlur(e: React.FocusEvent<HTMLInputElement>) {
		const email = e.target.value;
		if (email && !emailRegex.test(email)) {
			setEmailError("メールアドレスの形式が正しくありません");
		} else {
			setEmailError("");
		}
	}

	async function handleSubmit(formData: FormData) {
		const email = formData.get("email") as string;
		if (!emailRegex.test(email)) {
			setEmailError("メールアドレスの形式が正しくありません");
			return;
		}
		setEmailError("");
		await sendContactEmail(formData);
		router.push("/contact/success");
	}

	return (
		<main className="max-w-3xl mx-auto px-6 py-16 fade-in">
			<h1 className="text-3xl font-bold mb-2">お問い合わせ</h1>
			<p className="text-zinc-500 mb-12">お気軽にご連絡ください。</p>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					handleSubmit(new FormData(e.currentTarget));
				}}
				className="space-y-6"
			>
				<div>
					<label className="block text-sm font-medium text-zinc-700 mb-1">
						お名前
					</label>
					<input
						type="text"
						name="name"
						required
						maxLength={100}
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
						maxLength={200}
						onBlur={handleEmailBlur}
						className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
					/>
					{emailError && (
						<p className="text-red-500 text-xs mt-1">
							{emailError}
						</p>
					)}
				</div>

				<div>
					<label className="block text-sm font-medium text-zinc-700 mb-1">
						メッセージ
					</label>
					<textarea
						name="message"
						required
						maxLength={5000}
						rows={6}
						className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
					/>
				</div>

				<button
					type="submit"
					className="px-6 py-2 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 transition-colors cursor-pointer"
				>
					送信する
				</button>
			</form>
		</main>
	);
}
