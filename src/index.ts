import Fastify from 'fastify';
import * as ical from 'ical.js';
import { Isolate, ExternalCopy } from 'isolated-vm';
import get from 'axios';

const scriptsMemoryLimitInMb = 64;
const scriptsTimeoutInMs = 30000;

const fastify = Fastify({
	logger: true
});

interface V0Querystring {
	ical: string;
	js: string;
}

function jCal2iCalString(jCal: any): string {
	return new ical.Component(jCal).toString();
}

fastify.get<{ Querystring: V0Querystring }>('/v0/', async function (request, reply) {
	let isolate = new Isolate({ memoryLimit: scriptsMemoryLimitInMb, });
	let context = isolate.createContextSync();
	let global = context.global;
	global.setSync('global', global.derefInto());

	let icalResponse = await get(request.query.ical, { responseType: 'text' });
	var icalRaw = icalResponse.data;
	var jCalData = ical.parse(icalRaw);

	global.setSync('calendar', jCalData, { copy: true });
	context.evalSync(request.query.js, { timeout: scriptsTimeoutInMs });
	let newCalendar = context.evalSync('calendar', { timeout: scriptsTimeoutInMs, copy: true });
	console.log(request.query.js);
	console.log(newCalendar);

	reply.code(200).header('Content-type', 'text/calendar').send(jCal2iCalString(newCalendar));
	isolate.dispose();
});

fastify.listen(process.env.PORT, '0.0.0.0', function (err, address) {
	if (err) {
		fastify.log.error(err);
	}
});
