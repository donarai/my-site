import type { Metadata } from "next";
import Link from "next/link";
import { hobbyEvents } from "./data";

export const metadata: Metadata = {
	title: "Hobby | Don Araiのサイト",
};

const categoryStyle: Record<string, string> = {
	お笑い: "bg-orange-50 text-orange-700",
	音楽: "bg-blue-50 text-blue-700",
};

export default async function HobbyPage({
	searchParams,
}: {
	searchParams: Promise<{ tag?: string }>;
}) {
	const { tag } = await searchParams;

	const events = [...hobbyEvents]
		.filter((event) => !tag || event.acts?.includes(tag))
		.sort((a, b) => b.date.localeCompare(a.date));

	return (
		<main className="max-w-3xl mx-auto px-6 py-16 fade-in">
			<h1 className="text-3xl font-bold mb-2">Hobby</h1>
			<p className="text-zinc-500 mb-1">趣味の記録 (工事中)</p>
			<p className="text-zinc-500 mb-12">
				タグをクリックすると絞り込めます
			</p>

			{tag && (
				<p className="mb-8 text-sm text-zinc-500">
					「{tag}」で絞り込み中（{events.length}件）・{" "}
					<Link
						href="/hobby"
						className="underline hover:text-zinc-700"
					>
						フィルタ解除
					</Link>
				</p>
			)}

			<ul className="relative border-l border-zinc-200 space-y-8 ml-3">
				{events.map((event, i) => (
					<li key={i} className="pl-6 relative group cursor-default">
						<span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-300 border-2 border-white transition-colors group-hover:bg-zinc-500" />
						<div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-zinc-500 transition-colors group-hover:text-zinc-700">
							<span className="whitespace-nowrap">
								{event.date}
							</span>
							<span
								className={`whitespace-nowrap px-2 py-0.5 rounded-full text-xs font-medium ${categoryStyle[event.category] ?? "bg-zinc-100 text-zinc-700"}`}
							>
								{event.category}
							</span>
							{event.location && (
								<span className="whitespace-nowrap">
									📍{event.location}
								</span>
							)}
						</div>
						<p className="mt-1 font-medium transition-colors group-hover:text-zinc-900">
							{event.link ? (
								<a
									href={event.link}
									target="_blank"
									rel="noopener noreferrer"
									className="hover:underline"
								>
									{event.event}
								</a>
							) : (
								event.event
							)}
						</p>
						{event.acts && event.acts.length > 0 && (
							<div className="mt-2 flex flex-wrap gap-1.5">
								{event.acts.map((act, actIndex) => (
									<Link
										key={act}
										href={`/hobby?tag=${encodeURIComponent(act)}`}
										className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
											actIndex === 0
												? "bg-amber-100 text-amber-800 hover:bg-amber-200"
												: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
										}`}
									>
										{act}
									</Link>
								))}
							</div>
						)}
						{event.comment && (
							<p className="mt-1 text-sm text-zinc-500">
								{event.comment}
							</p>
						)}
					</li>
				))}
			</ul>
		</main>
	);
}
