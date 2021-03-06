var express = require('express');

var app = express();

var microtrace = require('./index.js');

/**
* express-basic-auth
*
* Example server. Just run in the same folder:
*
* npm install express express-basic-auth
*
* and then run this file with node ('node example.js')
*
* You can send GET requests to localhost:8080/async , /custom, /challenge or /static
* and see how it refuses or accepts your request matching the basic auth settings.
*/

app.get('/asdf', microtrace('FooService'), function(req, res) {
    microtrace.request(req).get('http://localhost:8080/showheaders').pipe(res);
});

app.get('/showheaders', microtrace('BarService'), function(req, res) {
    res.status(200).json(req.microtrace);
});

app.listen(8080, function() {
    console.log("Listening!");
});
