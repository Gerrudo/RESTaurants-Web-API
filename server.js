const fs = require('fs');
const express = require('express');
const app = express();
const https = require('https')
const bodyParser = require('body-parser');
const cors = require('cors');
const port = process.env.PORT || 1443;
const key = fs.readFileSync(__dirname + '/certs/privkey.pem');
const cert = fs.readFileSync(__dirname + '/certs/cert.pem');
const options = {
  key: key,
  cert: cert
};
require('./mongodb/InitaliseMongoCollections.js');
const routes = require('./routes/routes.js')
const server = https.createServer(options, app);
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/', routes);
server.listen(port, function(){
    console.log('listening on *:' + port);
});
