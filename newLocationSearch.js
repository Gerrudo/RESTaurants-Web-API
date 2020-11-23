const MongoClient = require('mongodb').MongoClient;
const dbConfig = require('./dbConfig.js');
const apiKey0 = require('./requestVarFile.js');
const request = require('request');

class locationSearch {

    async getResults(userCoordinates) {
        let placesJson = await this.webRequest('https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=' + apiKey0 + '&location=' + userCoordinates + '&rankby=distance&keyword =food&type=restaurant', 'GET');
        let placesObj = JSON.parse(placesJson);
        if (placesObj.status !== 'OK') {throw new Error(placesObj.status)};
        let randomPlace = placesObj.results[ Math.floor(Math.random() * placesObj.results.length)];
        let isCached = await this.cachedRequestCheck(randomPlace);
        return new Promise (async (resolve) => {
            //The 2 await result declarations are not running async
            if (isCached === true){
                let result = await this.getResultsFromCache(randomPlace);
                resolve(result);
            }else{
                let result = await this.newRequest(randomPlace);
                resolve(result);
            };
        });
    };
    
    webRequest(url, method){
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
    
    cachedRequestCheck(randomPlace){
        return new Promise (function (resolve) {
            MongoClient.connect(dbConfig.url, function(err, db) {
                if (err) throw new Error(err);
                let dbo = db.db(dbConfig.dbName);
                let query = {"result.place_id": randomPlace.place_id};
                dbo.collection("recentlocations").find(query).toArray(function(err, result) {
                    if (err) throw new Error(err);
                    db.close();
                    if (result.length !== 0){
                        let isCached = true;
                        resolve(isCached);
                    }else{
                        let isCached = false;
                        resolve(isCached);
                    };
                });
            });
        });
    };
    
    getResultsFromCache(randomPlace) {
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
    
    newRequest(randomPlace){
        return new Promise (async (resolve) => {
            let placeDetailsJson = await this.webRequest('https://maps.googleapis.com/maps/api/place/details/json?place_id='+randomPlace.place_id+'&key='+apiKey0, 'GET');
            let placeDetailsObj = JSON.parse(placeDetailsJson);
            this.collectResults(placeDetailsObj);
            jsonResponse = JSON.stringify(placeDetailsObj);
            resolve(jsonResponse);
        });
    };
    
    collectResults(placeDetailsObj){
        MongoClient.connect(dbConfig.url, function(err, db) {
            if (err) throw new Error(err);
            let dbo = db.db(dbConfig.dbName);
            dbo.collection("recentlocations").insertOne(placeDetailsObj, function(err, res) {
                if (err) throw new Error(err);
                db.close();
            });
        });
    };
};

module.exports = locationSearch;