const express = require('express');
const hbs = require('hbs');

var assert = require('assert');
var app = express();
var bodyParser = require('body-parser');
var multer = require('multer');
var xlstojson = require("xls-to-json-lc");
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var expressSession = require('express-session');

var url = 'mongodb://localhost:27017/service';

app.set('view engine', 'hbs');
app.use(bodyParser.json());

app.get('/alert1', (req, res) => {
    // console.log(req.session.alertLogin);
    res.render('alert.hbs', {
       
    });
});
app.get('/', (req, res) => {
    // console.log(req.session.alertLogin);
    res.render('index.hbs', {
       
    });
});


var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, './uploads/')
    },
    filename: function (req, file, cb) {
        var datetimestamp = Date.now();
        
        cb(null, datetimestamp + '-' + file.originalname);
    }
});

var upload = multer({ //multer settings
    storage: storage,
    fileFilter: function (req, file, callback) { //file filter
        if (['xls','xlsx'].indexOf(file.originalname.split('.')[file.originalname.split('.').length - 1]) === -1) {
            return callback(new Error('Wrong extension type'));
        }
        callback(null, true);
    }
}).single('file');

/** API path that will upload the files */
app.post('/upload', function(req, res) {
    var exceltojson;
    upload(req, res, function(err) {
        if (err) {
            res.json({ error_code: 1, err_desc: err });
            return;
        }
        if (!req.file) {
            res.json({ error_code: 1, err_desc: "No file passed" });
            return;
        }
        if (req.file.originalname.split('.')[req.file.originalname.split('.').length - 1] === 'xlsx') {
            exceltojson = xlsxtojson;
        } else {
            exceltojson = xlstojson;
        }
        console.log(req.file.path);
        try {
            exceltojson({
                input: req.file.path,
                output: null, //since we don't need output.json
                lowerCaseHeaders: true
            }, function(err, result) {
                if (err) {
                    return res.json({ error_code: 1, err_desc: err, data: null });
                }
               
                    for (var i = 0; i < result.length; i++) {
                    //ส่งได้อีก 4 SMS
                    //comment don't send a message
                    // var intelliSMS = require('intellisms');
                    // var sms = new intelliSMS('Bssirasit120', 'Bs0987383640');
                    //console.log(req.body.tel + " " + req.body.message);
                    var list = result[i];
                    console.log(list.fname);
                    sms.SendMessage({ to: list.tel, text: list.message }, function(err, id) {
                    if (err) console.log(err);
                    console.log(id);
                    
                    });  

                   //https:www.smsmatrix.com/matrix.json
                //     var options = {
                //     url: 'https://www.smsmatrix.com/matrix.json',
                //     method: 'POST',
                //     json: {
                //         username: 'Sirasit1208@gmail.com',//simple e-amil
                //         password: '123456789',//simple password
                //         txt: list.message,
                //         phone: list.tel
                //    }
                // };
            
                // console.log(list.message);
                // console.log(list.tel);
                // var request = require('request');
                
                // request(options, function(error, response, body) {
                //     if (error && (response.statusCode < 400)) {
                //         console.log(body);
                //     }
                // });
            }
                result.forEach(function(doc) {
                    MongoClient.connect(url, function(err, db) {
                        assert.equal(null, err);
                        db.collection('SendSMS').insert({
                            fname: doc.fname,
                            lname: doc.lname,
                            tel: doc.tel,
                            message: doc.message,
                        }, function(err, result) {
                            assert.equal(null, err);
                            console.log('Insert Complete ' + doc.tel);
                            db.close();
                        });
                    });
                });
                console.log("Send SMS complete !!!");
                res.redirect('/alert1');

            });
        } catch (e) {
            res.json({ error_code: 1, err_desc: "Corupted excel file" });
        }
    })

});


app.listen('3002', function () {
    console.log('running on 3002...');
});