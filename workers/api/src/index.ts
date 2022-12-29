/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import * as ical from "ical.js";

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const { searchParams } = new URL(request.url)
		let keep = searchParams.get('keep')
		if (!keep) {
			return new Response("No keep parameter provided", { status: 400 })
		}
		let srcCalendarUrl = searchParams.get('src')
		if (srcCalendarUrl) {
			let icalResponse = await fetch(srcCalendarUrl);
			var icalRaw = await icalResponse.text();
		} else {
			var icalRaw = await request.text();
		}
		var iCalContents = ical.parse(icalRaw);
		let subcomponents = iCalContents[2];
		let filteredSubcomponents = subcomponents.filter((data) => {
			let subcomponent = new ical.Component(data);
			let summary = subcomponent.getFirstPropertyValue('summary');
			return subcomponent.name != 'vevent' || summary.includes(keep);
		});
		iCalContents[2] = filteredSubcomponents;
		let filteredCalendar = new ical.Component(iCalContents);
		return new Response(filteredCalendar.toString());
	},
};
