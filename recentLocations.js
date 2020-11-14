const MongoClient = require('mongodb').MongoClient;
const dbConfig = require('./dbConfig.js');

let getRecentLocations = function getRecentLocations(){
    return new Promise (function (resolve) {
        MongoClient.connect(dbConfig.url, function(err, db) {
            if (err) throw new Error(err);
            let dbo = db.db(dbConfig.dbName);
            let mysort = { name: -1 };
            dbo.collection("recentlocations").find().limit(3).sort(mysort).toArray(function(err, result) {
                if (err) throw new Error(err);
                db.close();
              resolve(result);
            });
        });
    });
};

exports.getRecentLocations = getRecentLocations;