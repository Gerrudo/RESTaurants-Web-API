const recentLocations = require('../location/recentLocations.js');
const locationSearch = require('../location/newLocationSearch.js');
const signUp = require('/../auth/users/signUp.js')
const apiKey0 = require('../configs/requestVarFile.js');
const request = require('request');
const express = require('express');
const routes = express.Router();
const { check, validationResult} = require("express-validator/check");

routes.post('/newlocationsearch', async (req, res) => {
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

routes.get('/recentlocations', async (req, res) => {
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

routes.get('/images', (req, res) => {
    try{
        let url = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=2000&photoreference=${req.query.photo_reference}&key=${apiKey0}`;
        request.get(url).pipe(res);
    }catch(error){
        console.error(error);
        res.status(500);
        res.json({'message': 'Something went wrong, please try again.'});
    };
});

routes.post('/signup',
    //Input validation performed when route is declared. This may be worth changing into the class, as to keep seperation.
    [
        check("username", "Please Enter a Valid Username")
        .not()
        .isEmpty(),
        check("email", "Please enter a valid email").isEmail(),
        check("password", "Please enter a valid password").isLength({
            min: 6
        })
    ], 
    async (req, res) => {
        const errors = validationResult(req.body);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try{
            let newSignUp = new signUp();
            let responseObject = await newSignUp.validateUser(req.body)
            res.send(responseObject);
            res.status(201);
            res.json({
                'message': `Account created for ${req.body.username}.`,
                //Will also return token here.
            });
        }catch(error){
            console.error(error);
            res.status(500);
            res.json({'message': 'Something went wrong, please try again.'});
        };
});

module.exports = routes;