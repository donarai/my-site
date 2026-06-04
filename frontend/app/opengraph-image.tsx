import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
	return new ImageResponse(
		<div
			style={{
				width: 1200,
				height: 630,
				background: "#0f172a",
				display: "flex",
				flexDirection: "column",
				alignItems: "flex-start",
				justifyContent: "center",
				padding: "80px",
			}}
		>
			<p style={{ color: "#71717a", fontSize: 28, margin: "0 0 16px 0" }}>
				donarai.com
			</p>
			<h1
				style={{
					color: "white",
					fontSize: 80,
					fontWeight: "bold",
					margin: "0 0 24px 0",
				}}
			>
				Don Arai
			</h1>
			<p style={{ color: "#a1a1aa", fontSize: 36, margin: 0 }}>
				Backend Engineer
			</p>
		</div>,
		{ width: 1200, height: 630 },
	);
}
