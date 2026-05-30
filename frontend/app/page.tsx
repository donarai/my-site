export default function Home() {
	return (
		<main className="max-w-2xl mx-auto px-6 py-16">
			<h1 className="text-3xl font-bold mb-2">Don Arai</h1>
			<p className="text-zinc-500 mb-12">Backend Engineer</p>

			<section className="mb-10">
				<h2 className="text-xl font-semibold mb-4">経歴</h2>
				<ul className="space-y-3 text-zinc-700">
					<li>LINEヤフー入社</li>
					<li>大学</li>
				</ul>
			</section>

			<section>
				<h2 className="text-xl font-semibold mb-4">趣味</h2>
				<ul className="space-y-3 text-zinc-700">
					<li>ジム</li>
					<li>霜降り明星</li>
				</ul>
			</section>
		</main>
	);
}
