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
const apiKey0 = require('./requestVarFile.js');
const dbConfig = require('./dbConfig.js');

/*
Express Server Creation/Parsing Tools
*/

const server = https.createServer(options, app);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
server.listen(port, function(){
    console.log('listening on *:' + port);
});

/*
MongoDB Connectors/Collection creation
*/

const MongoClient = require('mongodb').MongoClient;

MongoClient.connect(dbConfig.url, function(err, db) {
    if (err) console.error(err);
     db.close();
});

MongoClient.connect(dbConfig.url, function(err, db) {
    if (err) console.error(err);
    let dbo = db.db(dbConfig.dbName);
    dbo.createCollection("recentlocations", function(err, res) {
        db.close();
    });
});

/*
External Web Request Methods
*/

function reusableRequest(url, method){
    let options = {
      'method': method,
      'url': url,
      'headers': {
        headers : ''
      }
    };
    return new Promise (function (resolve) {
      request(options, function (error, response) {
        if (error) console.error(error);
        resolve(response.body);
      });
    });
};

/*
Google Places API Request/Parsing 
*/

function newRequest(randomPlace){
    return new Promise (async function (resolve) {
        let getPlaceDetailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json?place_id='+randomPlace.place_id+'&key='+apiKey0;
        //Get placeDetails
        let placeDetailsJson = await reusableRequest(getPlaceDetailsUrl, 'GET');
        let placeDetailsObj = JSON.parse(placeDetailsJson);
        //Send results to collector to be inserted into DB collection
        collectResults(placeDetailsObj);
        jsonResponse = JSON.stringify(placeDetailsObj);
        resolve(jsonResponse);
    });
};

async function getResults(userCoordinates) {
    let placesJson = await reusableRequest('https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=' + apiKey0 + '&location=' + userCoordinates + '&rankby=distance&keyword =food&type=restaurant', 'GET');
    let placesObj = JSON.parse(placesJson);

    if (placesObj.status !== 'OK') {
        throw new Error(placesObj.status);
    };
    
    let randomPlace = placesObj.results[ Math.floor(Math.random() * placesObj.results.length)];
    let isCached = await cachedRequestCheck(randomPlace);
    return new Promise (async function (resolve) {
        if (isCached === true){
            MongoClient.connect(dbConfig.url, function(err, db) {
                if (err) console.log(err);
                let dbo = db.db(dbConfig.dbName);
                let query = {"result.place_id": randomPlace.place_id};
                    dbo.collection("recentlocations").find(query).toArray(function(err, result) {
                        if (err) console.error(err);
                        db.close();
                        resolve(result[0])
                    });
                });
        }else{
            let result = await newRequest(randomPlace);
            resolve(result);
        }
    })
};

function cachedRequestCheck(randomPlace){
    return new Promise (function (resolve) {
        MongoClient.connect(dbConfig.url, function(err, db) {
            if (err) console.log(err);
            let dbo = db.db(dbConfig.dbName);
            let query = {"result.place_id": randomPlace.place_id};
            dbo.collection("recentlocations").find(query).toArray(function(err, result) {
                if (err) console.error(err);
                    db.close();
                    if (result.length !== 0){
                        isCached = true;
                        resolve(isCached);
                    }else{
                        isCached = false;
                        resolve(isCached);
                    }
            });
        });
    })
}

function collectResults(placeDetailsObj){
    MongoClient.connect(dbConfig.url, function(err, db) {
        if (err) console.error(err);
        let dbo = db.db(dbConfig.dbName);
        dbo.collection("recentlocations").insertOne(placeDetailsObj, function(err, res) {
            if (err) console.error(err);
            db.close();
        });
    });
}

function getRecentLocations(){
    return new Promise (function (resolve) {
        MongoClient.connect(dbConfig.url, function(err, db) {
            if (err) console.error(err);
            let dbo = db.db(dbConfig.dbName);
            let mysort = { name: -1 };
            dbo.collection("recentlocations").find().limit(3).sort(mysort).toArray(function(err, result) {
              if (err) console.error(err);
              db.close();
              resolve(result);
            });
        });
    });
};

/*
API HANDLERS
*/

app.post('/newlocationsearch', async (req, res) => {
    try{
        let responseObject = await getResults(req.query.coordinates);
        res.send(responseObject);
    }catch(error){
        res.status(500);
        res.send(error.message);
    }
});

app.get('/recentlocations', async (res) => {
    try{
        let result = await getRecentLocations();
        jsonResponse = JSON.stringify(result);
        res.send(jsonResponse);
    }catch(error){
        res.status(500);
    };
});

app.get('/images', (req, res) => {
    let url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=2000&photoreference=${req.query.photo_reference}&key=${apiKey0}`;
    request.get(url).pipe(res);
});
