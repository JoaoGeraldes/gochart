const express = require('express');
const bodyParser = require('body-parser');
const request = require("request");
const fs = require('fs');

var pinoms = require('pino-multi-stream')
var streams = [
    { stream: fs.createWriteStream('./server/logs/request.log') },
    { level: 'fatal', stream: fs.createWriteStream('./server/logs/fatal.stream.out') }
]
var log = pinoms({ streams: streams })


const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
//app.use(expressPino);

app.get('/api', (req, res) => {
    log.info(req);
    let city = req.query.city || 'Aveiro';
    const apiOptions = {
        method: 'GET',
        url: 'https://community-open-weather-map.p.rapidapi.com/weather',
        qs: {
            id: '2172797',
            units: 'metric',
            mode: 'json',
            lang: 'pt',
            q: city
        },
        headers: {
            'x-rapidapi-host': 'community-open-weather-map.p.rapidapi.com',
            'x-rapidapi-key': 'b4df5082b2msh080615806cff35ep17a4a1jsncf6c49e48ac1'
        }
    }

    request(apiOptions, (error, response, body) => {
        if (error) throw new Error(error);
        res.send(body);

    });
});

app.listen(3001, () =>
    console.log('Express server is running on localhost:3001')
);