import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteNav from "./site-nav";

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
				<SiteNav />
				{children}
			</body>
		</html>
	);
}
