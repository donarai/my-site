import { FaGithub, FaXTwitter, FaLinkedin } from "react-icons/fa6";

export default function Home() {
	return (
		<main className="max-w-2xl mx-auto px-6 py-16 fade-in">
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
							2024.04 - 2026.03 &nbsp;&nbsp;基礎工学研究科
						</p>
					</li>
					<li>
						<p className="font-semibold">大阪大学</p>
						<p className="text-sm text-zinc-500 mt-1">
							2020.04 - 2024.03 &nbsp;&nbsp;基礎工学部
						</p>
					</li>
				</ul>
			</section>

			<section className="mb-10">
				<h2 className="text-xl font-semibold mb-6">スキル</h2>
				<ul className="flex flex-wrap gap-2">
					{[
						"Python",
						"Kotlin",
						"Spring Boot",
						"React",
						"Next.js",
						"TypeScript",
						"Docker",
					].map((skill) => (
						<li
							key={skill}
							className="px-3 py-1 bg-zinc-100 text-zinc-700 rounded-full text-sm"
						>
							{skill}
						</li>
					))}
				</ul>
			</section>

			<section className="mb-10">
				<h2 className="text-xl font-semibold mb-6">趣味</h2>
				<ul className="space-y-3 text-zinc-700">
					<li>ジム</li>
					<li>霜降り明星</li>
				</ul>
			</section>

			<section>
				<h2 className="text-xl font-semibold mb-6">リンク</h2>
				<ul className="flex gap-4">
					<li>
						<a
							href="https://github.com/donarai"
							target="_blank"
							rel="noopener noreferrer"
							className="text-zinc-700 hover:text-black transition-colors"
						>
							<FaGithub size={24} />
						</a>
					</li>
					<li>
						<a
							href="https://x.com/donarai7"
							target="_blank"
							rel="noopener noreferrer"
							className="text-zinc-700 hover:text-black transition-colors"
						>
							<FaXTwitter size={24} />
						</a>
					</li>
					<li>
						<a
							href="https://www.linkedin.com/in/donarai/"
							target="_blank"
							rel="noopener noreferrer"
							className="text-zinc-700 hover:text-black transition-colors"
						>
							<FaLinkedin size={24} />
						</a>
					</li>
				</ul>
			</section>
		</main>
	);
}
