const fs = require('fs');
const express = require('express');
const app = express();
const https = require('https')
const request = require('request');
const bodyParser = require('body-parser');
const cors = require('cors');
const port = process.env.PORT || 443;
const key = fs.readFileSync(__dirname + '/certs/privkey.pem');
const cert = fs.readFileSync(__dirname + '/certs/cert.pem');
const options = {
  key: key,
  cert: cert
};
const server = https.createServer(options, app);
app.use(cors());

// Configuring body parser middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

server.listen(port, function(){
    console.log('listening on *:' + port);
});

function reusableRequest(url){
    let options = {
      'method': 'GET',
      'url': url,
      'headers': {
        headers : ''
      }
    }

    return new Promise (function (resolve) {
      request(options, function (error, response) {
        if (error) throw new Error(error);
        resolve(response.body);
      });
    })
  };

async function getResults(userCoordinates) {
    try{
        const apiKey0 = require('./requestVarFile.js')
        //Search by location
        let getPlaceUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=' + apiKey0 + '&location=' + userCoordinates + '&rankby=distance&keyword =food&type=restaurant';
        let placesjson = await reusableRequest(getPlaceUrl);
        let placesobj = JSON.parse(placesjson);
        //Choose Random place
        let randomplace = placesobj.results[ Math.floor(Math.random() * placesobj.results.length)];
        let getPlaceDetailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json?place_id='+randomplace.place_id+'&key='+apiKey0;
        //Get placeDetails
        let placeDetailsJson = await reusableRequest(getPlaceDetailsUrl);
        let placeDetailsObj = JSON.parse(placeDetailsJson);
        let placeImageUrls = [];
        //This prevents the application from erroring, if there are no images for the place, creates URL array if place has images.
        if (placeDetailsObj.result.photos !== undefined){
            //Constructing image URLs into an Array
            //API key is readable in this URL, but is NOT usable by anyone outside my network, will address in later 
            for(let i=0; i<placeDetailsObj.result.photos.length; i++){
                placeImageUrls.push('https://maps.googleapis.com/maps/api/place/photo?maxwidth=2000&photoreference='+placeDetailsObj.result.photos[i].photo_reference+'&key='+apiKey0)
            }
            //Get PlaceMaps Details
            placeMapsUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey0}&q=place_id:${placeDetailsObj.result.place_id}`;
        }
        return placeDetailsJson;
    }catch(error){
        console.error(error);
        return error;
    }
};

app.post('/go', (req, res) => {

    function waitForDetails(userCoordinates){
        return new Promise (function (resolve) {
            responseObject = getResults(req.body.userCoordinates);
            resolve(responseObject)
        })
    }
    async function sendResponse(req){
        try{
            let responseObject = await waitForDetails(req.body.userCoordinates);
            res.send(responseObject)
        }catch(error){
            res.send(error)
        }
    }
    sendResponse(req);
});

