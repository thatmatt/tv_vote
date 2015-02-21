var twilio = require('twilio'),
    express = require('express');
// Create express app with middleware to parse POST body
var app = express();
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded());

//Twilio auth
var auth_token = process.env.TWILIO_TOKEN;

//Mongodb
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/test');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    console.log("database opened!");
});
var Schema = mongoose.Schema;
var smsSchema = new Schema({
    phone: String,
    show: String,
    date: {
        type: Date,
    default:
        Date.now
    }
});
var Sms = mongoose.model('Sms', smsSchema);
var shows = require("./shows.js");
var showTitles = shows.getShowTitles();
console.log(showTitles);
var now;
var agg;

function getResponse() {
    var responses = ["OK, let's watch ", "You really want to watch ", "Got it. Let's watch ", "One more for ", "Gonna watch ", "Flipping over to ", ];
    var idx = Math.floor(Math.random() * responses.length);
    return responses[idx];
}

// Create a route to respond to a call
app.post('/sms', function(req, res) {
    //Validate that this request really came from Twilio...
    if (twilio.validateExpressRequest(req, auth_token)) {
        var resp = new twilio.TwimlResponse();
        var fromNumber = req.body.From;
        var myNumber = req.body.To;
        var text = req.body.Body.toLowerCase();
        var textNum = parseInt(text, 10) - 1;
        //Check for valid response
        if (textNum >= 0 && textNum < showTitles.length) {
            var showText = showTitles[textNum];
            //Save in db
            var sms = new Sms({
                phone: fromNumber.substr(-4),
                show: showText
            });
            sms.save(function(err, _test) {
                if (err) return console.error(err);
            });
            var response = getResponse() + showText;
        } else {
            var response = "You didn't choose a valid show!";
        }
        resp.sms({
            to: fromNumber,
            from: myNumber
        }, response);
        res.writeHead(200, {
            'Content-Type': 'text/xml'
        });
        res.end(resp.toString());
    } else {
        res.send('you are not twilio.  Buzz off.');
    }
});

app.get('/results', function(req, res) {
    res.header("Access-Control-Allow-Origin", "*");
    //Only look for responses in the last three minutes
    now = new Date((new Date().getTime() - 3 * 60 * 1000));
    //Look for responses in the last three minutes, aggregated by show title
    //Rebuild each time to update the date.
    agg = [{
        $match: {
            date: {
                $gt: now
            }
        }
    }, {
        $group: {
            _id: "$show",
            total: {
                $sum: 1
            }
        }
    }, {
        $sort: {
            "total": -1
        }
    }];
    Sms.aggregate(agg, function(err, logs) {
        if (err) {
            return def.reject(err);
        }
        res.send(logs);
        console.log(logs);
    });
});

//Include static HTML in the 'html' directory
app.use(express.static(__dirname, 'html'));
app.listen(process.env.PORT || 3000);