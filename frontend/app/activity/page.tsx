type PushEvent = {
	repository: string;
	receivedAt: string;
	compareUrl: string;
};

export default async function ActivityPage() {
	const res = await fetch(
		`${process.env.BACKEND_URL ?? "http://localhost:8080"}/activity`,
		{ cache: "no-store" },
	);

	const events: PushEvent[] = await res.json();

	return (
		<main className="max-w-2xl mx-auto px-6 py-16 fade-in">
			<h1 className="text-3xl font-bold mb-2">Activity</h1>
			<p className="text-zinc-500 mb-12">
				GitHubへのpushが自動で表示されます
			</p>

			<ul className="relative border-l border-zinc-200 space-y-8 ml-3">
				{events.map((event, i) => (
					<li key={i} className="pl-6 relative group cursor-default">
						<span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-300 border-2 border-white transition-colors group-hover:bg-zinc-500" />
						<p className="text-sm text-zinc-500 transition-colors group-hover:text-zinc-700">
							{new Date(event.receivedAt).toLocaleString(
								"ja-JP",
								{
									timeZone: "Asia/Tokyo",
									year: "numeric",
									month: "long",
									day: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								},
							)}
						</p>
						<p className="mt-1 font-medium transition-colors group-hover:text-zinc-900">
							{event.compareUrl ? (
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
		</main>
	);
}
