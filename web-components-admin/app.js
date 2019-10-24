const express = require('express');
const mongoose = require('mongoose');
const async = require('async');
const fs = require('fs');
const session = require('express-session');

const analytics = require('./modules/analytics');

const Dishes = require('./models/dish');
const Visitors = require('./models/visitor');

const port = 3555;
const app = express();
const sess = {
    secret: 'keyboard cat',    
    resave: false,              
    saveUninitialized: true,            
    cookie: { secure: false, maxAge: 30 * 24 * 60 * 60 * 1000 }   
};

mongoose.connect('mongodb://localhost/restaurantadmin', {useNewUrlParser: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => { console.log('database connected'); });


app.use(session(sess));
app.use(express.static('public'))
app.use(express.json());
app.use(express.urlencoded({extended: true})); 

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    analytics(req);
    Dishes.find({}).sort({ zindex: 1})
    .then((dishes) => {
      res.render('home', {
          dishes: dishes
      });
    }, (err) => console.log(err))
    .catch((err) => console.log(err));
});

app.get('/admin', (req, res) => {
    res.render('admin');
});

app.get('/api/visitors', (req, res) => {
    Visitors.find({}, (err, visitors) => {
        if(!err)
            res.json(visitors);
        else
            console.log(err);
    });
});

app.get('/api/dishes', (req, res) => {
    Dishes.find({}).sort({ zindex: 1})
    .then((dishes) => {
      res.json(dishes)
    }, (err) => console.log(err))
    .catch((err) => console.log(err));
});

app.post('/api/dishes', (req, res) => {
    console.log('req body:', req.body)
    let i = 0;
    async.each(req.body, function(dish, next) {
        dish.position = i;
        Dishes.findByIdAndUpdate(dish._id, dish, { upsert: true, new: true }, (err, result) => {
            i++;
            next();
        });
    }, (err) => {
        if(err) console.log(err);
        res.json({"Status": "Success"});
    });
});

app.delete('/api/dishes', (req, res) => {
    Dishes.remove({ _id: req.body._id }, (err, result) => {
        if (!err)
            res.json({ status: `Ok! ${result} removed`})
        else
            res.json({ status: err });
    });
});

app.listen(port, () => {
    console.log(`server running on ${port}`)
});

