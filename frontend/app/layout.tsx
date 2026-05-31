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
	title: "Don Arai",
	description: "Backend Engineer",
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
					<div className="max-w-2xl mx-auto flex gap-6">
						<Link
							href="/"
							className="font-semibold hover:text-zinc-500"
						>
							Home
						</Link>
						<Link href="/activity" className="hover:text-zinc-500">
							Activity
						</Link>
					</div>
				</nav>
				{children}
			</body>
		</html>
	);
}
