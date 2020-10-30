const fs = require('fs');
const express = require('express');
const app = express();
const https = require('https')
const request = require('request');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongo = require('mongodb');
const port = process.env.PORT || 1443;
//Will need to provide certs, can change format from .pem if needed
const key = fs.readFileSync(__dirname + '/certs/privkey.pem');
const cert = fs.readFileSync(__dirname + '/certs/cert.pem');
const options = {
  key: key,
  cert: cert
};

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
const dbName = 'restaurants-web-api-db'
const dbHost = `protainer.lan:27017`
const url = `mongodb://${dbHost}/${dbName}`;

MongoClient.connect(url, function(err, db) {
    if (err) console.error(err);
    console.log(`Database ${dbName} created!`);
     db.close();
});

MongoClient.connect(url, function(err, db) {
    if (err) console.error(err);
    let dbo = db.db(dbName);
    dbo.createCollection("recent-locations", function(err, res) {
        if (err) console.error(err);
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

//Async function for getting all the results, returns placeDetailsJson
async function getResults(userCoordinates) {
    try{
        const apiKey0 = require('./requestVarFile.js')
        //Search by location
        let getPlaceUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=' + apiKey0 + '&location=' + userCoordinates + '&rankby=distance&keyword =food&type=restaurant';
            let placesJson = await reusableRequest(getPlaceUrl, 'GET');
                let placesObj = JSON.parse(placesJson);
        //Choose Random place
        let randomPlace = placesObj.results[ Math.floor(Math.random() * placesObj.results.length)];
        let getPlaceDetailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json?place_id='+randomPlace.place_id+'&key='+apiKey0;
        //Get placeDetails
        let placeDetailsJson = await reusableRequest(getPlaceDetailsUrl, 'GET');
            let placeDetailsObj = JSON.parse(placeDetailsJson);
        //This prevents the application from erroring, if there are no images for the place, creates URL array if place has images.
        if (placeDetailsObj.result.photos !== undefined){
            //Constructing image URLs into an Array and defining our object
            let placePhotosUrls = [];
            placeDetailsObj.result.photoUrls = []; 
            //API key is readable in this URL, but is NOT usable by anyone outside my network, will address in later 
            for(let i=0; i<placeDetailsObj.result.photos.length; i++){
                //pushes to array
                placePhotosUrls.push('https://maps.googleapis.com/maps/api/place/photo?maxwidth=2000&photoreference='+placeDetailsObj.result.photos[i].photo_reference+'&key='+apiKey0)
                //current item in array pushes to our object
                placeDetailsObj.result.photoUrls.push({"URL":placePhotosUrls[i]});
            }
            //Get PlaceMaps Details
            placeDetailsObj.result.mapsEmbedUrls = []; 
            placeDetailsObj.result.mapsEmbedUrls.push({"URL":`https://www.google.com/maps/embed/v1/place?key=${apiKey0}&q=place_id:${placeDetailsObj.result.place_id}`});
        }
        //Here we combine all our data into JSON together to be sent in the response
        //Return JSON to be sent in response to react
        jsonResponse = JSON.stringify(placeDetailsObj);
        return jsonResponse;
    }catch(error){
        console.error(error);
        //Return error in response to react
        return error;
    }
};
//Returns promise once all api requests have finished
function waitForDetails(userCoordinates){
    return new Promise (function (resolve) {
        responseObject = getResults(userCoordinates);
        resolve(responseObject)
    })
};
//Awaits for API promise to resolve
async function sendResponse(req, res){
    try{
        let responseObject = await waitForDetails(req.body.userCoordinates);
        res.send(responseObject)
    }catch(error){
        res.send(error)
    }
};

function collectResults(results){

}

/*
API HANDLERS
*/

//Handler for /go when userCoordinates is provided
app.post('/newlocationsearch', (req, res) => {
    //Sets off API requests and parsing, passes userCoordinates to Google Places Call function.
    sendResponse(req, res);
});

app.get('/recent-locations', (req, res) => {
    
});
