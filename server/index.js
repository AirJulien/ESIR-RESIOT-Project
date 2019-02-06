const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const http = require('http');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
//const router = require('./app/routes');

/*const auth = require('./app/middlewares/auth');
auth.init(passport);*/

app.use(cookieParser())

app.use(morgan('combined'));
app.use(bodyParser.json()); // parse application/json
app.use(cors());
app.use(express.static('static'));

//router(app, auth);

//var db = require('./config/config');
//console.log('dburl : '+db.url)

app.use(passport.initialize())
app.use(passport.session())

http.createServer(app).listen(port, () => {
   console.log('Listening on ' + port);
});

exports = module.exports = app;