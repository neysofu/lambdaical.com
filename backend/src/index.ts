import Fastify from 'fastify';
import { Isolate, ExternalCopy } from 'isolated-vm';
import get from 'axios';
import * as fs from 'fs';

const scriptsMemoryLimitInMb = 64;
const scriptsTimeoutInMs = 50000;
const icalJsLocation = require.resolve('ical.js/build/ical.min.js');

const fastify = Fastify({
	logger: true
});

interface V0Querystring {
	ical: string;
	js: string;
}

fastify.get('/v0/ping', async function (request, reply) {
	reply.send('Hello, world!');
});

fastify.get<{ Querystring: V0Querystring }>('/v0/', async function (request, reply) {
	const isolate = new Isolate({ memoryLimit: scriptsMemoryLimitInMb, });
	const context = isolate.createContextSync();
	const global = context.global;
	global.setSync('global', global.derefInto());

	let code = fs.readFileSync(icalJsLocation);
	isolate.compileScriptSync(code.toString()).runSync(context);

	const icalResponse = await get(request.query.ical, { responseType: 'text' });

	// Input calendar data is passed to the sandbox first as a string, then as a
	// jCal object, and finally as an ical.js component.
	global.setSync("input", icalResponse.data, { copy: true });
	context.evalSync("var jcal = ICAL.parse(input);");
	context.evalSync("var calendar = new ICAL.Component(jcal);");

	// Execute all user-provided logic.
	context.evalSync(request.query.js, { timeout: scriptsTimeoutInMs });

	// We serialize the calendar back into a string, preserving all the changes
	// made by the user. We keep all serialization logic inside
	// the sandbox for clear security reasons.
	const modifiedCalendar = context.evalSync("new ICAL.Component(calendar.toJSON()).toString()", { timeout: scriptsTimeoutInMs, copy: true });

	reply.code(200).header('Content-type', 'text/calendar').send(modifiedCalendar);
	isolate.dispose();
});

fastify.listen(process.env.PORT || 8080, '0.0.0.0');
