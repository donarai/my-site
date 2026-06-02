export default function Loading() {
	return (
		<main className="max-w-2xl mx-auto px-6 py-16 fade-in">
			<h1 className="text-3xl font-bold mb-2">Activity</h1>
			<p className="text-zinc-500 mb-12">
				GitHubへのpushが自動で表示されます
			</p>

			<ul className="relative border-l border-zinc-200 space-y-8 ml-3">
				{[...Array(3)].map((_, i) => (
					<li key={i} className="pl-6 relative">
						<span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-200 border-2 border-white" />
						<div className="h-4 w-32 bg-zinc-100 rounded animate-pulse mb-2" />
						<div className="h-4 w-48 bg-zinc-100 rounded animate-pulse" />
					</li>
				))}
			</ul>
		</main>
	);
}
