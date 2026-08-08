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
	metadataBase: new URL("https://donarai.com"),
	title: "Don Araiのサイト",
	description: "Backend Engineer",
	openGraph: {
		title: "Don Arai",
		description: "Backend Engineer",
		url: "https://donarai.com",
		siteName: "Don Arai",
	},
	twitter: {
		card: "summary",
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
				<nav className="border-b px-4 sm:px-6 py-4">
					<div className="max-w-2xl mx-auto">
						<div className="scroll-shadow-x overflow-x-auto">
							<div className="flex items-center gap-6 w-max sm:w-full sm:justify-between">
								<Link
									href="/"
									className="font-bold text-lg tracking-tight whitespace-nowrap"
								>
									Don Arai のサイト
								</Link>
								<div className="flex gap-6">
									<Link
										href="/"
										className="text-sm hover:text-zinc-500 transition-colors whitespace-nowrap"
									>
										Home
									</Link>
									<Link
										href="/activity"
										className="text-sm hover:text-zinc-500 transition-colors whitespace-nowrap"
									>
										Activity
									</Link>
									<Link
										href="/hobby"
										className="text-sm hover:text-zinc-500 transition-colors whitespace-nowrap"
									>
										Hobby
									</Link>
									<Link
										href="/contact"
										className="text-sm hover:text-zinc-500 transition-colors whitespace-nowrap"
									>
										Contact
									</Link>
								</div>
							</div>
						</div>
					</div>
				</nav>
				{children}
			</body>
		</html>
	);
}
