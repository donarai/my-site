import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Don Araiのサイト",
	description: "Backend Engineer",
	openGraph: {
		title: "Don Arai",
		description: "Backend Engineer",
		url: "https://donarai.com",
		siteName: "Don Arai",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="ja"
			className={`${geistSans.variable} ${geistMono.variable} antialiased`}
		>
			<body>
				<nav className="border-b px-6 py-4">
					<div className="max-w-2xl mx-auto flex items-center justify-between">
						<Link
							href="/"
							className="font-bold text-lg tracking-tight"
						>
							Don Arai のサイト
						</Link>
						<div className="flex gap-6">
							<Link
								href="/"
								className="text-sm hover:text-zinc-500 transition-colors"
							>
								Home
							</Link>
							<Link
								href="/activity"
								className="text-sm hover:text-zinc-500 transition-colors"
							>
								Activity
							</Link>
						</div>
					</div>
				</nav>
				{children}
			</body>
		</html>
	);
}
