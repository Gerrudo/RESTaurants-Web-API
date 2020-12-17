const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const MongoClient = require('mongodb').MongoClient;
const dbConfig = require('../../configs/dbConfig.js');

class signUp {
    constructor(){

    };

    //Validation
    validateUser(userInfo) {
        //Check if User exists
        MongoClient.connect(dbConfig.url, (err, db) => {
            if (err) throw new Error(err);
            let dbo = db.db(dbConfig.dbName);
            let query = {"username": userInfo.username};
            dbo.collection("users").find(query).toArray((err, result) => {
                if (err) throw new Error(err);
                db.close();
                if (result.length !== 0) {
                    //If exists, break and return 400 
                    resolve(isCached);
                }else{
                    //If !exists, encryptUserInfo
                    this.encryptUserInfo(userInfo);
                };
            });
        });
    };

    encryptUserInfo(validUserInfo) {
        //Encrypt payload

        //collectUserInfo
    };

    collectUserInfo(encryptedUserInfo) {
        //Save encrypted payload
        //return 201 OK
    };

    //Catch error

};

module.exports = signUp;

