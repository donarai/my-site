type PushEvent = {
	repository: string;
	receivedAt: string;
};

export default async function ActivityPage() {
	const res = await fetch(
		`${process.env.BACKEND_URL ?? "http://localhost:8080"}/activity`,
		{ cache: "no-store" },
	);

	const events: PushEvent[] = await res.json();

	return (
		<main className="max-w-2xl mx-auto px-6 py-16">
			<h1 className="text-3xl font-bold mb-2">Activity</h1>
			<p className="text-zinc-500 mb-12">
				GitHubへのpushが自動で表示されます
			</p>

			<ul className="space-y-4">
				{events.map((event, i) => (
					<li key={i} className="border rounded-lg p-4">
						<p className="font-mono text-sm text-zinc-500">
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
						<p className="mt-1">{event.repository} に push</p>
					</li>
				))}
			</ul>
		</main>
	);
}
