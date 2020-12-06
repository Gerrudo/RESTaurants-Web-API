const MongoClient = require('mongodb').MongoClient;
const dbConfig = require('../configs/dbConfig.js');

class signUp {
    constructor(){

    }

    //Validation
    validateUser(userInfo) {
        //Check if User exists 
    }

    encryptUserInfo(validUserInfo) {
        //Encrypt payload
    }

    collectUserInfo(encryptedUserInfo) {
        //Save encrypted payload
        //return 200 OK
    }

    //Catch error

}

module.exports = signUp;