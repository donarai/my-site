import { Fragment } from "react";
import { splitHugeClusters } from "@/worker/chat-protocol";

// 発言の本文。巨大な1文字が含まれていても、枠の中で折り返して表示する
export function MessageText({ text }: { text: string }) {
	return splitHugeClusters(text).map((part, i) => (
		<Fragment key={i}>
			{i > 0 && <wbr />}
			{part}
		</Fragment>
	));
}
