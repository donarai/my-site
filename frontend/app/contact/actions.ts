"use server";

export async function sendContactEmail(formData: FormData) {
	const name = formData.get("name") as string;
	const email = formData.get("email") as string;
	const message = formData.get("message") as string;

	const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";

	try {
		const res = await fetch(`${backendUrl}/contact`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, email, message }),
		});

		console.log("status:", res.status);
		const text = await res.text();
		console.log("body:", text);

		if (!res.ok) {
			throw new Error("送信に失敗しました");
		}
	} catch (e) {
		console.error("fetch error:", e);
		throw e;
	}
}
