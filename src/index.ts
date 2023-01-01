import Fastify from 'fastify';
import * as ical from 'ical.js';
import get from 'axios';

const fastify = Fastify({
	logger: true
});

interface V0Querystring {
	s: string;
	keep: string;
}

fastify.get<{ Querystring: V0Querystring }>('/v0/', async function (request, reply) {
	let icalResponse = await get(request.query.s, { responseType: 'text' });
	var icalRaw = icalResponse.data;
	var iCalContents = ical.parse(icalRaw);
	let subcomponents = iCalContents[2];
	let filteredSubcomponents = subcomponents.filter((data: any) => {
		let subcomponent = new ical.Component(data);
		let summary = subcomponent.getFirstPropertyValue('summary');
		return subcomponent.name != 'vevent' || summary.includes(request.query.keep);
	});
	iCalContents[2] = filteredSubcomponents;
	let filteredCalendar = new ical.Component(iCalContents);
	reply.code(200).header('Content-type', 'text/calendar').send(filteredCalendar.toString());
})

fastify.listen({ port: 3000 }, function (err, address) {
	if (err) {
		fastify.log.error(err);
	}
});
