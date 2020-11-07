# RESTaurants-Web-API
Backend Web API for the RESTaurants WebApp

## Requirements

- [x] Have request URL where post requests are handled and display back data without error, must be async.
- [x] Clean up getResults(userCoordinates) function, make eaiser to read
- [x] Check all variable names
- [x] Check if working with actual react frontend framework
- [x] Impliment recent seaches API endpoint
    - [x] Setup MongoDB using docker image
    - [x] Add Mongo DB connectiors
    - [x] initialise DB and collection creation + error handling
    - [x] Create functions for inputting new data into the DB
    - [x] Create API endpoint for getting recent-locations collection
    - [x] Create insert for current results data: Name, Address(City/Town only), 1 image, link to google maps
- [x] Use MongoDB to save details about user requests
- [ ] Handle rating limiting issue with google API
- [x] Have the database store and display results caching system
    - [x] Only have API requests for new embeds and images (This is currently client side, this needs to be changed.)
        - [x] Create endpoints for image requests
        - [x] Update API and cache to construct and store only the image reference. 
        - [x] Use our endpoint to be able to respond to any photo refrence and provide the specified photo from Google Places API
    - [ ] Impliment API rate limiting based on IP address/Cookies
- [ ] Move to Azure/AWS/GCloud for hosting
