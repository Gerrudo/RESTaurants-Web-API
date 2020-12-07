const { check, validationResult} = require("express-validator/check");
const MongoClient = require('mongodb').MongoClient;
const dbConfig = require('../configs/dbConfig.js');

class signUp {
    constructor(){

    }

    //Validation
    validateUser(userInfo) {
        //Check if User exists

        //If exists, break and return 400 

        //If !exists, encryptUserInfo
    }

    encryptUserInfo(validUserInfo) {
        //Encrypt payload

        //collectUserInfo
    }

    collectUserInfo(encryptedUserInfo) {
        //Save encrypted payload
        //return 201 OK
    }

    //Catch error

}

module.exports = signUp;