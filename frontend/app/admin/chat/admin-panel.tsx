"use client";

import { useCallback, useEffect, useState } from "react";
import { formatDateTime } from "@/lib/date";
import { MessageText } from "@/app/chat/message-text";
import {
	ADMIN_API_PREFIX,
	MAX_TEXT_LENGTH,
	type AdminState,
} from "@/worker/chat-protocol";

const BAN_OPTIONS = [
	{ minutes: 60, label: "1時間" },
	{ minutes: 24 * 60, label: "1日" },
	{ minutes: 30 * 24 * 60, label: "30日" },
];

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function callApi<T>(path: string, body?: object): Promise<ApiResult<T>> {
	try {
		const res = await fetch(`${ADMIN_API_PREFIX}${path}`, {
			method: body ? "POST" : "GET",
			headers: body ? { "Content-Type": "application/json" } : undefined,
			body: body ? JSON.stringify(body) : undefined,
			cache: "no-store",
		});
		const data: unknown = await res.json().catch(() => ({}));
		if (!res.ok) {
			const message = (data as { error?: unknown }).error;
			return {
				ok: false,
				error: typeof message === "string" ? message : `エラー ${res.status}`,
			};
		}
		return { ok: true, data: data as T };
	} catch {
		// Access のログイン期限が切れると、ログイン画面への転送で通信が失敗する
		return {
			ok: false,
			error: "通信に失敗しました。ページを再読み込みして、ログインし直してください",
		};
	}
}

export default function AdminPanel() {
	const [state, setState] = useState<AdminState | null>(null);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const [draft, setDraft] = useState("");
	const [banMinutes, setBanMinutes] = useState(BAN_OPTIONS[0].minutes);

	const applyState = useCallback((result: ApiResult<AdminState>) => {
		if (result.ok) {
			setState(result.data);
			setError("");
		} else {
			setError(result.error);
		}
	}, []);

	const load = useCallback(async () => {
		applyState(await callApi<AdminState>("/state"));
	}, [applyState]);

	// 最初の表示で一覧を読み込む。結果が届いてから state を更新する
	useEffect(() => {
		callApi<AdminState>("/state").then(applyState);
	}, [applyState]);

	async function act(path: string, body: object, confirmMessage?: string) {
		if (confirmMessage && !window.confirm(confirmMessage)) return false;
		setBusy(true);
		const result = await callApi(path, body);
		setBusy(false);
		if (!result.ok) {
			setError(result.error);
			return false;
		}
		await load();
		return true;
	}

	async function handlePost(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		if (!draft.trim()) return;
		if (await act("/messages", { text: draft })) setDraft("");
	}

	const buttonClass =
		"px-3 py-1 rounded-lg text-xs border border-zinc-300 hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

	return (
		<div className="space-y-12">
			{error && (
				<p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg px-4 py-3">
					{error}
				</p>
			)}

			<section>
				<div className="flex items-center justify-between mb-4">
					<h2 className="text-xl font-semibold">管理人として発言</h2>
					<button type="button" onClick={load} className={buttonClass}>
						再読み込み
					</button>
				</div>
				<form onSubmit={handlePost} className="flex gap-2">
					<input
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						maxLength={MAX_TEXT_LENGTH}
						placeholder="管理人の印付きで発言します"
						aria-label="管理人としての発言"
						className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
					/>
					<button
						type="submit"
						disabled={busy || !draft.trim()}
						className="px-6 py-2 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 transition-colors cursor-pointer disabled:bg-zinc-300 disabled:cursor-not-allowed"
					>
						送信
					</button>
				</form>
			</section>

			<section>
				<div className="flex flex-wrap items-center justify-between gap-2 mb-4">
					<h2 className="text-xl font-semibold">
						発言
						{state && (
							<span className="ml-2 text-sm font-normal text-zinc-500">
								オンライン {state.online}人
							</span>
						)}
					</h2>
					<label className="text-xs text-zinc-500">
						締め出す長さ
						<select
							value={banMinutes}
							onChange={(e) => setBanMinutes(Number(e.target.value))}
							className="ml-2 border border-zinc-300 rounded px-2 py-1"
						>
							{BAN_OPTIONS.map((option) => (
								<option key={option.minutes} value={option.minutes}>
									{option.label}
								</option>
							))}
						</select>
					</label>
				</div>
				{!state ? (
					<p className="text-sm text-zinc-400">
						{error ? "表示できません" : "読み込み中…"}
					</p>
				) : state.messages.length === 0 ? (
					<p className="text-sm text-zinc-400">発言はありません</p>
				) : (
					<ul className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg">
						{state.messages.map((message) => (
							<li key={message.id} className="p-4">
								<p className="text-xs text-zinc-500">
									<span className="font-medium text-zinc-700">
										{message.name}
									</span>
									{message.owner && (
										<span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-medium">
											管理人
										</span>
									)}
									<span className="ml-2">
										{formatDateTime(message.sentAt)}
									</span>
									{message.ipKey && (
										<span className="ml-2 font-mono">{message.ipKey}</span>
									)}
								</p>
								<p className="mt-1 text-sm text-zinc-800 break-words whitespace-pre-wrap">
									<MessageText text={message.text} />
								</p>
								<div className="mt-2 flex gap-2">
									<button
										type="button"
										disabled={busy}
										onClick={() =>
											act("/messages/delete", { id: message.id }, "この発言を削除しますか？")
										}
										className={buttonClass}
									>
										削除
									</button>
									{!message.owner && (
										<button
											type="button"
											disabled={busy}
											onClick={() =>
												act(
													"/bans",
													{ messageId: message.id, minutes: banMinutes },
													`${message.name} さんを締め出しますか？`,
												)
											}
											className={buttonClass}
										>
											この人を締め出す
										</button>
									)}
								</div>
							</li>
						))}
					</ul>
				)}
			</section>

			<section>
				<h2 className="text-xl font-semibold mb-4">締め出し中</h2>
				{!state || state.bans.length === 0 ? (
					<p className="text-sm text-zinc-400">締め出している人はいません</p>
				) : (
					<ul className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg">
						{state.bans.map((ban) => (
							<li
								key={ban.ipKey}
								className="p-4 flex flex-wrap items-center justify-between gap-2"
							>
								<div className="text-xs text-zinc-600">
									<p className="font-mono">{ban.ipKey}</p>
									<p className="mt-1">
										{formatDateTime(ban.until)} まで・{ban.reason}
									</p>
								</div>
								<button
									type="button"
									disabled={busy}
									onClick={() => act("/bans/delete", { ipKey: ban.ipKey })}
									className={buttonClass}
								>
									解除
								</button>
							</li>
						))}
					</ul>
				)}
			</section>

			<section>
				<h2 className="text-xl font-semibold mb-4">部屋のリセット</h2>
				<p className="text-sm text-zinc-500 mb-3">
					保存しているすべての発言を消します。元には戻せません。
				</p>
				<button
					type="button"
					disabled={busy}
					onClick={() =>
						act("/reset", {}, "すべての発言を消します。よろしいですか？")
					}
					className="px-4 py-2 rounded-lg text-sm border border-red-300 text-red-700 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50"
				>
					すべての発言を消す
				</button>
			</section>
		</div>
	);
}
