export default function Home() {
	return (
		<main className="max-w-2xl mx-auto px-6 py-16">
			<h1 className="text-3xl font-bold mb-2">Arai Don</h1>
			<p className="text-zinc-500 mb-12">荒井 盾</p>

			<section className="mb-10">
				<h2 className="text-xl font-semibold mb-6">経歴</h2>
				<ul className="space-y-6">
					<li>
						<p className="font-semibold">LINEヤフー株式会社</p>
						<p className="text-sm text-zinc-500 mt-1">
							2026.04 - 現在 &nbsp;&nbsp;
						</p>
					</li>
					<li>
						<p className="font-semibold">大阪大学</p>
						<p className="text-sm text-zinc-500 mt-1">
							2020.04 - 2025.03 &nbsp;&nbsp;基礎工学部
						</p>
					</li>
				</ul>
			</section>

			<section>
				<h2 className="text-xl font-semibold mb-6">趣味</h2>
				<ul className="space-y-3 text-zinc-700">
					<li>ジム</li>
					<li>霜降り明星</li>
				</ul>
			</section>
		</main>
	);
}
