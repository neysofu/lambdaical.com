import * as ical from "ical.js";
import { Base64 } from 'js-base64';

export interface Env { }

// Function that takes a Url as input and parses the rules, e.g.
// https://example.com/calendar.ics/base64-of-src-url/merge/another-base64/filter-attribute-contains-foo/filter-attribute-regex-foo
// =foo&keep=bar&keep=baz

async function apiV0(srcCalendarUrl: string, keep: string): Promise<Response> {
	let icalResponse = await fetch(srcCalendarUrl);
	var icalRaw = await icalResponse.text();
	var iCalContents = ical.parse(icalRaw);
	let subcomponents = iCalContents[2];
	let filteredSubcomponents = subcomponents.filter((data) => {
		let subcomponent = new ical.Component(data);
		let summary = subcomponent.getFirstPropertyValue('summary');
		return subcomponent.name != 'vevent' || summary.includes(keep);
	});
	iCalContents[2] = filteredSubcomponents;
	let filteredCalendar = new ical.Component(iCalContents);
	return new Response(filteredCalendar.toString(), { headers: { "Content-Type": "text/calendar" } });
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url)
		const src = url.searchParams.get('s');
		const keep = url.searchParams.get('keep');
		if (!src) {
			return new Response("No src parameter provided", { status: 400 })
		}
		if (!keep) {
			return new Response("No keep parameter provided", { status: 400 })
		}
		return await apiV0(src, keep);
	},
};
