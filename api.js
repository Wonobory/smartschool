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










app.get('/validarhorari', (req, res) => {
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

        res.json({type: 'done', message: 'Logged in successfully'});
    } else {
        res.json({type: 'error', message: 'Invalid email or password', redirect: '/validarhorari'});
    }
});

