"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendContactEmail(formData: FormData) {
	const name = formData.get("name") as string;
	const email = formData.get("email") as string;
	const message = formData.get("message") as string;

	await resend.emails.send({
		from: "お問い合わせ <contact@donarai.com>",
		to: "almach3d@gmail.com",
		subject: `【お問い合わせ】${name}さんより`,
		text: `名前: ${name}\nメール: ${email}\n\n${message}`,
	});
}
