const dbConfig = require('../configs/dbConfig.js');
const MongoClient = require('mongodb').MongoClient;

MongoClient.connect(dbConfig.url, function(err, db) {
    if (err) throw new Error(err)
    db.close();
});

MongoClient.connect(dbConfig.url, function(err, db) {
    if (err) throw new Error(err)
    let dbo = db.db(dbConfig.dbName);
    dbo.createCollection("recentlocations", function(err, res) {
        try {
            if (err) throw new Error(err)
            console.log('Collection created');
            db.close();
        }catch(err){
            console.error(`Collection may already exist. Please see following error. ${err}`)
        }
    });
});