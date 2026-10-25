"use client";

import { useEffect, useRef, useState } from "react";
import { formatDateTime } from "@/lib/date";
import {
	CHAT_WS_PATH,
	MAX_NAME_LENGTH,
	MAX_TEXT_LENGTH,
	MIN_SEND_INTERVAL_MS,
	isReservedName,
	normalizeName,
	type ChatMessage,
	type ClientEvent,
	type ServerEvent,
} from "@/worker/chat-protocol";

const NAME_STORAGE_KEY = "chat-name";
// 接続が切られないよう、定期的に "ping" を送る間隔
const PING_INTERVAL_MS = 30_000;
// 再接続を待つ時間の上限
const MAX_RETRY_DELAY_MS = 30_000;
// 画面に残しておく発言の最大数
const MAX_VISIBLE_MESSAGES = 200;
// サーバーが規則違反として切断するときの終了コード
const POLICY_VIOLATION = 1008;

type Status = "connecting" | "open" | "reconnecting" | "rejected";

function readSavedName(): string {
	try {
		return localStorage.getItem(NAME_STORAGE_KEY) ?? "";
	} catch {
		return "";
	}
}

function saveName(name: string) {
	try {
		localStorage.setItem(NAME_STORAGE_KEY, name);
	} catch {
		// プライベートモードなどで保存できなくても、チャットは使える
	}
}

export default function ChatRoom() {
	const [name, setName] = useState<string | null>(null);
	const [nameError, setNameError] = useState("");
	const [status, setStatus] = useState<Status>("connecting");
	const [rejectReason, setRejectReason] = useState("");
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [online, setOnline] = useState(0);
	const [draft, setDraft] = useState("");
	const [coolingDown, setCoolingDown] = useState(false);
	const [error, setError] = useState("");
	const socketRef = useRef<WebSocket | null>(null);
	const listRef = useRef<HTMLUListElement>(null);

	// 名前が決まったら WebSocket で接続し、切れたら間隔を広げながら再接続する
	useEffect(() => {
		if (!name) return;
		const userName = name;

		let socket: WebSocket | null = null;
		let retryCount = 0;
		let retryTimer: ReturnType<typeof setTimeout> | undefined;
		let pingTimer: ReturnType<typeof setInterval> | undefined;
		let disposed = false;

		const connect = () => {
			const protocol = location.protocol === "https:" ? "wss:" : "ws:";
			const url = `${protocol}//${location.host}${CHAT_WS_PATH}?name=${encodeURIComponent(userName)}`;
			const ws = new WebSocket(url);
			socket = ws;
			socketRef.current = ws;

			ws.addEventListener("open", () => {
				retryCount = 0;
				setStatus("open");
				pingTimer = setInterval(() => ws.send("ping"), PING_INTERVAL_MS);
			});

			ws.addEventListener("message", (e) => {
				if (e.data === "pong") return;
				let event: ServerEvent;
				try {
					event = JSON.parse(e.data);
				} catch {
					return;
				}
				switch (event.type) {
					case "history":
						setMessages(event.messages);
						break;
					case "message":
						setMessages((prev) =>
							[...prev, event.message].slice(-MAX_VISIBLE_MESSAGES),
						);
						break;
					case "delete":
						setMessages((prev) => prev.filter((m) => m.id !== event.id));
						break;
					case "reset":
						setMessages([]);
						break;
					case "presence":
						setOnline(event.online);
						break;
					case "error":
						setError(event.error);
						break;
				}
			});

			ws.addEventListener("close", (e) => {
				clearInterval(pingTimer);
				if (socketRef.current === ws) socketRef.current = null;
				if (disposed) return;
				// サーバーに拒否された接続は、つなぎ直しても同じ結果になるので諦める
				if (e.code === POLICY_VIOLATION) {
					setStatus("rejected");
					setRejectReason(e.reason);
					return;
				}
				setStatus("reconnecting");
				const delay = Math.min(1000 * 2 ** retryCount, MAX_RETRY_DELAY_MS);
				retryCount++;
				retryTimer = setTimeout(connect, delay);
			});
		};

		connect();

		return () => {
			disposed = true;
			clearTimeout(retryTimer);
			clearInterval(pingTimer);
			socket?.close();
		};
	}, [name]);

	// 新しい発言が来たら一番下までスクロールする
	useEffect(() => {
		const list = listRef.current;
		if (list) list.scrollTop = list.scrollHeight;
	}, [messages]);

	// エラー表示は数秒で消す
	useEffect(() => {
		if (!error) return;
		const timer = setTimeout(() => setError(""), 3000);
		return () => clearTimeout(timer);
	}, [error]);

	function handleJoin(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		// サーバーと同じ規則で先に確かめ、だめな理由をすぐに伝える
		const value = normalizeName(new FormData(e.currentTarget).get("name"));
		if (!value) {
			setNameError("使えない文字だけの名前か、長すぎる名前です");
			return;
		}
		if (isReservedName(value)) {
			setNameError("その名前は使えません");
			return;
		}
		saveName(value);
		setNameError("");
		setMessages([]);
		setOnline(0);
		setRejectReason("");
		setStatus("connecting");
		setName(value);
	}

	function handleSend(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const socket = socketRef.current;
		const text = draft.trim();
		if (!text || coolingDown || !socket || socket.readyState !== WebSocket.OPEN) return;
		const event: ClientEvent = { type: "message", text };
		socket.send(JSON.stringify(event));
		setDraft("");
		// サーバーの連投制限に引っかからないよう、送信後しばらくボタンを止める
		setCoolingDown(true);
		setTimeout(() => setCoolingDown(false), MIN_SEND_INTERVAL_MS);
	}

	if (!name) {
		return (
			<form onSubmit={handleJoin} className="space-y-4">
				<div>
					<label
						htmlFor="chat-name"
						className="block text-sm font-medium text-zinc-700 mb-1"
					>
						ニックネーム
					</label>
					<input
						id="chat-name"
						name="name"
						required
						maxLength={MAX_NAME_LENGTH}
						autoComplete="nickname"
						// 前回の名前を入力欄に入れておく
						ref={(el) => {
							if (el && !el.value) el.value = readSavedName();
						}}
						className="w-full border border-zinc-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
					/>
					{nameError && (
						<p className="text-red-500 text-xs mt-1">{nameError}</p>
					)}
				</div>
				<button
					type="submit"
					className="px-6 py-2 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 transition-colors cursor-pointer"
				>
					参加する
				</button>
			</form>
		);
	}

	const statusLabel = {
		connecting: "接続中…",
		open: `オンライン ${online}人`,
		reconnecting: "切断されました。再接続しています…",
		rejected: rejectReason || "接続できませんでした",
	}[status];

	return (
		<div>
			<div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-sm">
				<p className="flex items-center gap-2 text-zinc-500">
					<span
						className={`w-2 h-2 rounded-full ${status === "open" ? "bg-green-500" : "bg-zinc-300"}`}
					/>
					{statusLabel}
				</p>
				<p className="text-zinc-500">
					{name} として参加中・
					<button
						type="button"
						onClick={() => setName(null)}
						className="underline hover:text-zinc-700 cursor-pointer"
					>
						名前を変える
					</button>
				</p>
			</div>

			<ul
				ref={listRef}
				className="h-96 overflow-y-auto border border-zinc-200 rounded-lg p-4 space-y-4"
			>
				{messages.length === 0 && (
					<li className="text-sm text-zinc-400">
						まだ発言はありません
					</li>
				)}
				{messages.map((message) => (
					<li key={message.id}>
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
						</p>
						<p className="mt-0.5 text-sm text-zinc-800 break-words whitespace-pre-wrap">
							{message.text}
						</p>
					</li>
				))}
			</ul>

			<p className="h-5 mt-1 text-xs text-red-500">{error}</p>

			<form onSubmit={handleSend} className="flex gap-2">
				<input
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					maxLength={MAX_TEXT_LENGTH}
					placeholder="メッセージを入力"
					aria-label="メッセージ"
					className="flex-1 min-w-0 border border-zinc-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400"
				/>
				<button
					type="submit"
					disabled={status !== "open" || !draft.trim() || coolingDown}
					className="px-6 py-2 bg-zinc-800 text-white rounded-lg text-sm hover:bg-zinc-700 transition-colors cursor-pointer disabled:bg-zinc-300 disabled:cursor-not-allowed"
				>
					送信
				</button>
			</form>

			{process.env.NODE_ENV === "development" && status !== "open" && (
				<p className="mt-4 text-xs text-zinc-400">
					next dev ではチャットに接続できません。npm run preview
					で確認してください。
				</p>
			)}
		</div>
	);
}
