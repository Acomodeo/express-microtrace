var assert = require('assert');
var uuid = require('uuid').v4;
var request = require('request');

var HEADER = 'X-Service-Trace';

function errorMiddleware(err, req, res, next) {
    res.status(500).json({
        requestId: req.microtrace.requestId,
        serviceTrace: req.microtrace.trace,
        status: err.stats ? err.status : 500,
        error: err.toString()
    });
}

function buildMiddleware(serviceName) {
    var SERVICE_NAME = serviceName || process.env.MICROTRACE_SERVICE_NAME;

    assert(SERVICE_NAME, 'Missing service name for the Microtrace middleware. Either pass as parameter or int eh MICROTRACE_SERVICE_NAME env variable');

    return function(req, res, next) {
        if(hasServiceTrace(req))
            req.microtrace = addToServiceTrace(req);
        else
            req.microtrace = createNewTrace();

        next();
    };

    function getServiceTrace(req) {
        return req.get(HEADER);
    }

    function hasServiceTrace(req) {
        return !!getServiceTrace(req);
    }

    function parseServiceTrace(req) {
        var raw = getServiceTrace(req);

        var bigSplit = raw.split('|');

        var requestId = bigSplit[0];
        var trace = bigSplit[1].split('->');

        return {
            requestId: requestId,
            trace: trace
        };
    }

    function setServiceTrace(res, trace) {
        res.set(HEADER, buildServiceTraceHeader(trace));
    }

    function addToServiceTrace(req) {
        var newTrace = parseServiceTrace(req);
        newTrace.trace.push(SERVICE_NAME);

        return newTrace;
    }

    function createNewTrace() {
        return {
            requestId: uuid(),
            trace: [
                SERVICE_NAME
            ]
        };
    }
}

function buildServiceTraceHeader(microtrace) {
    return microtrace.requestId + '|' + microtrace.trace.join('->');
}

function headeredRequest(req) {
    var headers = {};

    const trace = req ? req.microtrace : createNewTrace();

    headers[HEADER] = buildServiceTraceHeader(trace);

    return request.defaults({
        headers: headers
    });
}

buildMiddleware.request = headeredRequest;

module.exports = buildMiddleware;
