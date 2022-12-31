import * as ical from "ical.js";
import { Base64 } from 'js-base64';
import { Validator } from 'jsonschema';

export interface Env { }

// Operators
// Filter-event-by-attribute-contains
// Filter-event-by-attribute-regex
// Filter-event-by-date
// Merge

interface Merge {
	kind: 'merge';
	calendars: Calendar[];
}

type LogicQuantifier = 'all' | 'any';

interface ComponentFilter {
	kind: 'component-filter';
	nameFilter: StringFilter;
	quantifier: LogicQuantifier;
	propertyFilter: PropertyFilter;
}

interface StringFilter {
	kind: 'string-filter';
	// regex
}

interface PropertyFilter {
	kind: 'property-filter';
	nameFilter: StringFilter;
	valueFilter: StringFilter;
}

interface Calendar {
	url: string;
}

// Function that takes a Url as input and parses the rules, e.g.
// https://example.com/calendar.ics/base64-of-src-url/merge/another-base64/filter-attribute-contains-foo/filter-attribute-regex-foo
// =foo&keep=bar&keep=baz

async function apiV0(base64payload: string): Promise<Response> {
	const payload = Base64.decode(base64payload);
	const { searchParams } = new URL(request.url)
	const searchParamsArray = Array.from(searchParams.entries());
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
	return new Response(filteredCalendar.toString(), { headers: { "Content-Type": "text/calendar" } });
}

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext
	): Promise<Response> {
		const url = new URL(request.url)
		url.
	},
};
