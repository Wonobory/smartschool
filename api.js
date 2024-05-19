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

    //Revisa si l'horari d'avui ja ha estat validat
    const avui2 = new Date().toISOString().slice(0, 10);
    const sql2 = `SELECT * FROM horaris_validats WHERE user_id = ${req.session.userId} AND dia = '${avui2}'`;
    const result2 = await pool.query(sql2);
    let horariValidat = false;
    if (result2.length > 0) horariValidat = true;

    if (horariValidat) {
        const horari = JSON.parse(result2[0].horari);
        const hourCount = contarHores(horari);
        res.json({horari: horari, horesTotals: hourCount, horariValidat: horariValidat});
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

    res.json({horari: null, horesTotals: 0, horariValidat: horariValidat});
});

app.post('/validar-horari', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    if (!req.body.horari) {
        const sql = `SELECT * FROM users WHERE id = ${req.session.userId}`;
        const result = await pool.query(sql)
        
        var horari = horariAvui(JSON.parse(result[0].horari));
    } else {
        var horari = req.body.horari;
    }


    //Revisa que els horaris siguin vàlids
    let horaris_comprovats = []
    for (var i = 0; i < horari.length; i++) {
        let start = horari[i][0].split(':');
        start = parseInt(start[0]) * 60 + parseInt(start[1]);
        let end = horari[i][1].split(':');
        end = parseInt(end[0]) * 60 + parseInt(end[1]);

        
        for (var x = 0; x < horaris_comprovats.length; x++) {
            if ((start >= horaris_comprovats[x][0] && start <= horaris_comprovats[x][1])
                || (end >= horaris_comprovats[x][0] && end <= horaris_comprovats[x][1])
                || (horaris_comprovats[x][0] >= start && horaris_comprovats[x][1] <= end)) {
                    res.status(400).json({type: 'error', message: 'Horari invalid'});
                    return res.end();
            }
        }

        if (start >= end || isNaN(start) || isNaN(end)) {
            res.status(400).json({type: 'error', message: 'Horari invalid'});
            return res.end();
        }

        horaris_comprovats.push([start, end]);
    }

    //Comprova que no s'hagi validat ja l'horari d'avui
    const avui = new Date().toISOString().slice(0, 10);
    const sql = `SELECT * FROM horaris_validats WHERE user_id = ${req.session.userId} AND dia = '${avui}'`;
    const result = await pool.query(sql);

    if (result.length > 0) {
        res.status(400).json({type: 'error', message: "Ja has validat l'horari d'avui"});
        return res.end();
    }

    //Si s'han passat totes les comprovacions anteriors significa que ja el podem incloure a la base de dades
    const sql2 = `INSERT INTO horaris_validats (user_id, dia, horari) VALUES (${req.session.userId}, '${avui}', '${JSON.stringify(horari)}')`;
    await pool.query(sql2);
    res.json({type: 'done', message: 'Horari validat correctament'});       
})


//Busca l'horari que toca el dia d'avui
function horariAvui(horari) {
    const avui = new Date().getDay();
    for (var i = 0; i < horari.length; i++) {
        if (horari[i].dia == avui) {
            return horari[i].horari;
        }
    }
    return null;
}

function contarHores(horari) {
    let count = 0;
    for (var i = 0; i < horari.length; i++) {
        const time = horari[i][0].split(':');
        const time2 = horari[i][1].split(':');

        const h1 = parseInt(time[0]) + parseInt(time[1]) / 60;
        const h2 = parseInt(time2[0]) + parseInt(time2[1]) / 60;

        count += h2 - h1;
    }
    return count;
}