const recentLocations = require('../location/recentLocations.js');
const locationSearch = require('../location/newLocationSearch.js');
const apiKey0 = require('../configs/requestVarFile.js');
const request = require('request');
const express = require('express');
const app = express.Router();

app.post('/newlocationsearch', async (req, res) => {
    try{
        let newlocationSearch = new locationSearch();
        let responseObject = await newlocationSearch.getResults(req.query.coordinates);
        res.send(responseObject);
    }catch(error){
        console.error(error);
        res.status(500);
        res.json({'message': 'Something went wrong, please try again.'});
    };
});

app.get('/recentlocations', async (req, res) => {
    try{
        let result = await recentLocations.getRecentLocations();
        jsonResponse = JSON.stringify(result);
        res.send(jsonResponse);
    }catch(error){
        console.error(error);
        res.status(500);
        res.json({'message': 'Something went wrong, please try again.'});
    };
});

app.get('/images', (req, res) => {
    try{
        let url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=2000&photoreference=${req.query.photo_reference}&key=${apiKey0}`;
        request.get(url).pipe(res);
    }catch(error){
        console.error(error);
        res.status(500);
        res.json({'message': 'Something went wrong, please try again.'});
    };
});

module.exports = app;