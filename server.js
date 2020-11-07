const fs = require('fs');
const express = require('express');
const app = express();
const https = require('https')
const request = require('request');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = process.env.PORT || 1443;
//Will need to provide certs, can change format from .pem if needed
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

//Creating server with cert options
const server = https.createServer(options, app);
//Cors for later use and bodyParser for reading JSON body of incoming responses
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//Start listening on 443 for connections
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
    }
    //Returns promise once Google Place API Request has finished
    return new Promise (function (resolve) {
      request(options, function (error, response) {
        if (error) throw new Error(error);
        resolve(response.body);
      });
    })
};

/*
Google Places API Request/Parsing 
*/

//Async function if we need to make a new request or if it can be pulled from the database.
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
    })
}

//Async function for getting all the results, returns placeDetailsJson
function getResults(userCoordinates) {
    try{
        return new Promise (async function (resolve) {
        //Search by location
            let placesJson = await reusableRequest('https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=' + apiKey0 + '&location=' + userCoordinates + '&rankby=distance&keyword =food&type=restaurant', 'GET');
            let placesObj = JSON.parse(placesJson);
            //Choose Random place
            let randomPlace = placesObj.results[ Math.floor(Math.random() * placesObj.results.length)];
            //Check if data we got is cached in the database
            let isCached = await cachedRequestCheck(randomPlace);
            //If we have the data, pull from db, if not, make a new request.
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
    }catch(error){
        console.error(error);
        return error;
    }
};

function cachedRequestCheck(randomPlace){
    return new Promise (function (resolve) {
        //Here We will add the database to check for selected place_id
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

//Returns promise once all api requests have finished
function waitForDetails(userCoordinates){
    return new Promise (async function (resolve) {
        let responseObject = await getResults(userCoordinates);
        resolve(responseObject);
    })

    //Should probably form a promise.all connection that we can resolve here

};
//Awaits for API promise to resolve
async function sendLocationResponse(req, res){
    try{
        let responseObject = await waitForDetails(req.body.userCoordinates);
        res.send(responseObject);
    }catch(error){
        res.send(error);
    }
};
//Returning results to the database
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

/*
API HANDLERS
*/

//Handler for /go when userCoordinates is provided
app.post('/newlocationsearch', (req, res) => {
    //Sets off API requests and parsing, passes userCoordinates to Google Places Call function.
    sendLocationResponse(req, res);
});

app.get('/recentlocations', (req, res) => {
    MongoClient.connect(dbConfig.url, function(err, db) {
        if (err) console.error(err);
        let dbo = db.db(dbConfig.dbName);
        let mysort = { name: -1 };
        dbo.collection("recentlocations").find().limit(3).sort(mysort).toArray(function(err, result) {
          if (err) console.error(err);
          db.close();
          jsonResponse = JSON.stringify(result);
            try{
                res.send(jsonResponse);
            }catch(error){
                res.send(error);
            }
        });
    });
});

app.get('/images', (req, res) => {
    let url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=2000&photoreference=${req.query.photo_reference}&key=${apiKey0}`;
    request.get(url).pipe(res);
});
