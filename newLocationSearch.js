const MongoClient = require('mongodb').MongoClient;
const dbConfig = require('./dbConfig.js');
const apiKey0 = require('./requestVarFile.js');
const request = require('request');

let getResults = async function getResults(userCoordinates) {
    let placesJson = await reusableRequest('https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=' + apiKey0 + '&location=' + userCoordinates + '&rankby=distance&keyword =food&type=restaurant', 'GET');
    let placesObj = JSON.parse(placesJson);
    if (placesObj.status !== 'OK') {throw new Error(placesObj.status)};
    let randomPlace = placesObj.results[ Math.floor(Math.random() * placesObj.results.length)];
    let isCached = await cachedRequestCheck(randomPlace);
    return new Promise (async function (resolve) {
        if (isCached === true){
            let result = getResultsFromCache(randomPlace);
            resolve(result);
        }else{
            let result = await newRequest(randomPlace);
            resolve(result);
        };
    });
};

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
        if (error) throw new Error(error);
        resolve(response.body);
      });
    });
};

function cachedRequestCheck(randomPlace){
    return new Promise (function (resolve) {
        MongoClient.connect(dbConfig.url, function(err, db) {
            if (err) throw new Error(err);
            let dbo = db.db(dbConfig.dbName);
            let query = {"result.place_id": randomPlace.place_id};
            dbo.collection("recentlocations").find(query).toArray(function(err, result) {
                if (err) throw new Error(err);
                db.close();
                if (result.length !== 0){
                    isCached = true;
                    resolve(isCached);
                }else{
                    isCached = false;
                    resolve(isCached);
                };
            });
        });
    });
};

function getResultsFromCache(randomPlace) {
    MongoClient.connect(dbConfig.url, function(err, db) {
        if (err) throw new Error(err);
        let dbo = db.db(dbConfig.dbName);
        let query = {"result.place_id": randomPlace.place_id};
        dbo.collection("recentlocations").find(query).toArray(function(err, result) {
            return new Promise (function (resolve) {
                if (err) throw new Error(err);
                db.close();
                resolve(result[0]);
            });
        });
    });
};

function newRequest(randomPlace){
    return new Promise (async function (resolve) {
        let placeDetailsJson = await reusableRequest('https://maps.googleapis.com/maps/api/place/details/json?place_id='+randomPlace.place_id+'&key='+apiKey0, 'GET');
        let placeDetailsObj = JSON.parse(placeDetailsJson);
        collectResults(placeDetailsObj);
        jsonResponse = JSON.stringify(placeDetailsObj);
        resolve(jsonResponse);
    });
};

function collectResults(placeDetailsObj){
    MongoClient.connect(dbConfig.url, function(err, db) {
        if (err) throw new Error(err);
        let dbo = db.db(dbConfig.dbName);
        dbo.collection("recentlocations").insertOne(placeDetailsObj, function(err, res) {
            if (err) throw new Error(err);
            db.close();
        });
    });
};

exports.getResults = getResults;