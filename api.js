const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const mysql = require('mysql');
const crypto = require("crypto");
const { promisify } = require('util')
session = require('express-session');

require("dotenv").config();

app.listen(80, () => {
    console.log('Server is running on port 80');
});


const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "smartschool"
})

pool.query = promisify(pool.query)

app.use(cors({ origin: '*' }));
app.use(function(req, res, next){
    res.header('Acess-Control-Allow-Origin', "*")
    res.header('Acess-Control-Allow-Methods', "GET,PUT,POST,DELETE")
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next()
})
app.use(bodyParser.urlencoded({
    extended: true
}));

//SESSION CONFIG
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 2 }
}));

app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'public')));





/*
AUTH REQUIRED:

if (!req.session.userId) {
    res.redirect('/login');
    return res.end();
}

*/




app.get('/dashboard', (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    res.sendFile(path.join(__dirname, '/client/home.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '/client/login.html'));
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const hash = crypto.createHash('sha256').update(password).digest('hex');
    

    const query = `SELECT * FROM users WHERE email = '${email}' AND pass = '${hash}'`;
    const result = await pool.query(query);

    if (result.length > 0) {
        req.session.userId = result[0].id;
        req.session.role = result[0].role;

        res.json({type: 'done', message: 'Logged in successfully', redirect: '/dashboard'});
    } else {
        res.json({type: 'error', message: 'Invalid email or password'});
    }
});

app.get('/horari-esperat', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    const sql = `SELECT * FROM users WHERE id = ${req.session.userId}`;
    const result = await pool.query(sql);
    const horari = JSON.parse(result[0].horari);
    const avui = new Date().getDay();

    for (var i = 0; i < horari.length; i++) {
        if (horari[i].dia == avui) {
            //format: [["9:30","13:00"],["17:00","20:00"]]...
            var count = 0
            for (var x = 0; x < horari[i].horari.length; x++) {
                //HORA D'INICI
                const time = horari[i].horari[x][0].split(':');
                const h = parseInt(time[0]);
                const m = parseInt(time[1]);

                const totalMinutes = h * 60 + m;
                
                //HORA DE FINAL
                const time2 = horari[i].horari[x][1].split(':');
                const h2 = parseInt(time2[0]);
                const m2 = parseInt(time2[1]);
                
                count += ((h2 * 60 + m2) - totalMinutes) / 60;
            }

            res.json({horari: horari[i].horari, horesTotals: parseFloat(count.toFixed(2))});
            return res.end();
        }
    }

    res.json({horari: null, horesTotals: 0});
});

