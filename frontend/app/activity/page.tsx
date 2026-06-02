import { Suspense } from "react";

type PushEvent = {
	id: number;
	repository: string;
	receivedAt: string;
	compareUrl: string;
};

async function ActivityList() {
	const res = await fetch(
		`${process.env.BACKEND_URL ?? "http://localhost:8080"}/activity`,
		{ cache: "no-store" },
	);
	const events: PushEvent[] = await res.json();

	return (
		<ul className="relative border-l border-zinc-200 space-y-8 ml-3">
			{events.map((event, i) => (
				<li key={i} className="pl-6 relative group cursor-default">
					<span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-300 border-2 border-white transition-colors group-hover:bg-zinc-500" />
					<p className="text-sm text-zinc-500 transition-colors group-hover:text-zinc-700">
						{new Date(event.receivedAt).toLocaleString("ja-JP", {
							timeZone: "Asia/Tokyo",
							year: "numeric",
							month: "long",
							day: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						})}
					</p>
					<p className="mt-1 font-medium transition-colors group-hover:text-zinc-900">
						{event.compareUrl?.startsWith("https://github.com/") ? (
							<a
								href={event.compareUrl}
								target="_blank"
								rel="noopener noreferrer"
								className="hover:underline"
							>
								{event.repository} に push
							</a>
						) : (
							<>{event.repository} に push</>
						)}
					</p>
				</li>
			))}
		</ul>
	);
}

function ActivitySkeleton() {
	return (
		<ul className="relative border-l border-zinc-200 space-y-8 ml-3">
			{[...Array(3)].map((_, i) => (
				<li key={i} className="pl-6 relative">
					<span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-200 border-2 border-white" />
					<div className="h-4 w-32 bg-zinc-100 rounded animate-pulse mb-2" />
					<div className="h-4 w-48 bg-zinc-100 rounded animate-pulse" />
				</li>
			))}
		</ul>
	);
}

export default function ActivityPage() {
	return (
		<main className="max-w-2xl mx-auto px-6 py-16 fade-in">
			<h1 className="text-3xl font-bold mb-2">Activity</h1>
			<p className="text-zinc-500 mb-12">
				GitHubへのpushが自動で表示されます
			</p>

			<Suspense fallback={<ActivitySkeleton />}>
				<ActivityList />
			</Suspense>
		</main>
	);
}
