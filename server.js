const fs = require('fs');
const express = require('express');
const app = express();
const https = require('https')
const request = require('request');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = process.env.PORT || 1443;
const key = fs.readFileSync(__dirname + '/certs/privkey.pem');
const cert = fs.readFileSync(__dirname + '/certs/cert.pem');
const options = {
  key: key,
  cert: cert
};

require('./mongodb/InitaliseMongoCollections.js');
const recentLocations = require('./location/recentLocations.js');
const locationSearch = require('./location/newLocationSearch.js');


const server = https.createServer(options, app);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
server.listen(port, function(){
    console.log('listening on *:' + port);
});

app.post('/newlocationsearch', async (req, res) => {
    try{
        let newlocationSearch = new locationSearch();
        let responseObject = await newlocationSearch.getResults(req.query.coordinates);
        res.send(responseObject);
    }catch(error){
        console.error(error);
        res.status(500);
        res.json({'message': 'Something went wrong, please try again.'});
    };
});

app.get('/recentlocations', async (req, res) => {
    try{
        let result = await recentLocations.getRecentLocations();
        jsonResponse = JSON.stringify(result);
        res.send(jsonResponse);
    }catch(error){
        console.error(error);
        res.status(500);
        res.json({'message': 'Something went wrong, please try again.'});
    };
});

app.get('/images', (req, res) => {
    try{
        let url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=2000&photoreference=${req.query.photo_reference}&key=${apiKey0}`;
        request.get(url).pipe(res);
    }catch(error){
        console.error(error);
        res.status(500);
        res.json({'message': 'Something went wrong, please try again.'});
    };
});
