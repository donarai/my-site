"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HiBars3, HiXMark } from "react-icons/hi2";

const LINKS = [
	{ href: "/activity", label: "Activity" },
	{ href: "/hobby", label: "Hobby" },
	{ href: "/chat", label: "Chat" },
	{ href: "/contact", label: "Contact" },
];

// PC では横並びのリンク、スマホでは三本線のボタンで開閉するメニューを出す。
// 切り替えは Tailwind の sm: の幅（640px）を境にしている
export default function SiteNav() {
	const [open, setOpen] = useState(false);

	// メニューを開いているときは Esc キーでも閉じられるようにする
	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [open]);

	// ページを移動したらメニューを閉じる。新しいタブで開いたときは閉じない
	const close = () => setOpen(false);

	return (
		<>
			{/* メニューの外側を薄く暗くする幕。押すとメニューを閉じる */}
			{open && (
				<div
					aria-hidden="true"
					onClick={close}
					className="sm:hidden fixed inset-0 z-10 bg-black/20"
				/>
			)}

			{/* relative と z-20 で、ナビと開いたメニューを幕より手前に出す */}
			<nav className="relative z-20 bg-white border-b px-4 sm:px-6 py-4">
				<div className="max-w-3xl mx-auto">
					<div className="flex items-center justify-between gap-6">
						<Link
							href="/"
							onNavigate={close}
							className="font-bold text-lg tracking-tight whitespace-nowrap"
						>
							Don Arai のサイト
						</Link>

						<ul className="hidden sm:flex gap-6">
							{LINKS.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className="text-sm hover:text-zinc-500 transition-colors whitespace-nowrap"
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>

						<button
							type="button"
							onClick={() => setOpen((value) => !value)}
							aria-expanded={open}
							aria-controls="mobile-menu"
							aria-label={open ? "メニューを閉じる" : "メニューを開く"}
							className="sm:hidden -mr-2 p-2 rounded-lg text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer"
						>
							{open ? <HiXMark size={24} /> : <HiBars3 size={24} />}
						</button>
					</div>
				</div>

				{/* スマホのメニュー。ナビの真下に重ねて表示し、下のページは動かさない */}
				<div
					id="mobile-menu"
					hidden={!open}
					className="sm:hidden absolute inset-x-0 top-full bg-white border-b border-zinc-200 shadow-lg"
				>
					<ul className="px-4 py-2">
						{LINKS.map((link) => (
							<li key={link.href}>
								<Link
									href={link.href}
									onNavigate={close}
									className="block py-3 hover:text-zinc-500 transition-colors"
								>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</nav>
		</>
	);
}
