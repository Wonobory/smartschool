const express = require('express');
const app = express();
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const mysql = require('mysql');
const crypto = require("crypto");
const { promisify } = require('util')
session = require('express-session');

const fs = require('fs');


const multer = require('multer');

const upload = multer({ dest: 'public/uploads/', limits: { fileSize: 25 * 1024 * 1024 }});
const cron = require('node-cron');

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

app.post('/update-pfp', upload.single('file'), async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    if (!req.file) {
        res.status(400).json({type: 'error', message: 'No s\'ha pujat cap arxiu'});
        return res.end();
    }

    const sql = "UPDATE users SET foto_perfil = ? WHERE id = ?";
    await pool.query(sql, [req.file.filename, req.session.userId]);

    res.json({type: 'done', message: 'S\'ha cambiat la foto de perfil', filename: req.file.filename});
})

app.get('/', (req, res) => {
    res.redirect('/dashboard');
    return res.end();
});



app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
    return res.end();
})

app.get('/admin', (req, res) => {
    if (!req.session.userId || !req.session.admin) {
        res.redirect('/login');

        console.log(req.session.admin, req.session.userId)
        return res.end();
    }
    res.sendFile(path.join(__dirname, '/client/treballadors.html'));
})

app.post('/admin/api/donar-baixa', async (req, res) => {
    if (!req.session.userId || req.session.role == 1) {
        res.redirect('/login');
        return res.end();
    }

    if (!req.body.id) {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    const sql = "UPDATE users SET actiu = 0 WHERE id = ?";
    await pool.query(sql, [req.body.id]);

    res.json({type: 'done', message: 'Usuari donat de baixa correctament'});
})

app.post('/admin/api/reactivar', async (req, res) => {
    if (!req.session.userId || !req.session.admin) {
        res.redirect('/login');
        return res.end();
    }

    if (!req.body.id) {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    const sql = "UPDATE users SET actiu = 1 WHERE id = ?";
    await pool.query(sql, [req.body.id]);
    res.json({type: 'done', message: 'Usuari reactivat correctament'});
})
    

app.get('/admin/treballador/:id', (req, res) => {
    if (!req.session.userId || !req.session.admin) {
        res.redirect('/login');
        return res.end();
    }

    const filePath = path.join(__dirname, '/client/treballador.html');

    // Lee el archivo
    fs.readFile(filePath, 'utf8', async (err, data) => {
        if (err) {
            return res.status(500).send('Error al leer el archivo');
        }

        const sql = "SELECT * FROM users WHERE id = ?";
        const result = await pool.query(sql, [req.params.id])

        const sql2 = "SELECT * FROM rols WHERE id = ?";
        const result2 = await pool.query(sql2, [result[0].role])

        const rol = result2.find(x => x.id == result[0].role);

        const sql3 = `SELECT * FROM horaris_validats WHERE MONTH(dia) = MONTH(CURDATE()) AND YEAR(dia) = YEAR(CURDATE()) AND user_id = ?;`
        const horarisValidats = await pool.query(sql3, [req.params.id])

        const sql4 = `SELECT * FROM absencies WHERE MONTH(dia) = MONTH(CURDATE()) AND YEAR(dia) = YEAR(CURDATE()) AND user_id = ?;`
        const absencies = await pool.query(sql4, [req.params.id])

        const sql5 = `SELECT * FROM dies_pendents WHERE user_id = ?`
        const diesPendents = await pool.query(sql5, [req.params.id])

        const sql6 = `SELECT * FROM trajectes WHERE user_id = ? AND pagat = 0`
        const trajectes = await pool.query(sql6, [req.params.id])

        let totalKm = 0;
        trajectes.forEach(trajecte => {
            totalKm += trajecte.km;
        })

        let horesValidades = 0;
        horarisValidats.forEach(horari => {
            horesValidades += contarHores(JSON.parse(horari.horari));
        })

        let absenciesH = 0;
        absencies.forEach(absencia => {
            if (!absencia.computen) {
                absenciesH += contarHores(JSON.parse(absencia.horari_esperat));
            }
        })

        const jsonData = {
            id: result[0].id,
            nom: result[0].nom,
            cognom: result[0].cognom,
            role: result[0].role == -1 ? 'Inactiu' : (result[0].genere ? rol.nom_f : rol.nom_m),
            horesContracte: result[0].hores_contracte,
            trajectes: totalKm,
            balançHores: await calcularBalançHores(req.params.id),
            horesValidades: horesValidades,
            absencies: absencies.length,
            absenciesHores: absenciesH,
            foto_perfil: result[0].foto_perfil,
            horari: JSON.parse(result[0].horari),
            actiu: result[0].actiu,
        }
            
        const jsonString = JSON.stringify(jsonData);


        const scriptTag = `<script>
            const dades = ${jsonString};
        </script>`;

        const modifiedData = `${scriptTag}\n${data}`;

        res.setHeader('Content-Type', 'text/html');
        res.send(modifiedData);
    });
})

app.get('/admin/treballadors/afegir', (req, res) => {
    if (!req.session.userId || !req.session.admin) {
        res.redirect('/login');
        return res.end();
    }

    res.sendFile(path.join(__dirname, '/client/nou_treballador.html'));
})

app.get('/admin/treballadors/cambiar-dades/:id', async (req, res) => {
    if (!req.session.userId || !req.session.admin == 1) {
        res.redirect('/login');
        return res.end();
    }

    const sql = "SELECT * FROM users WHERE id = ?";
    const result = await pool.query(sql, [req.params.id])

    if (result.length == 0) {
        res.sendFile(path.join(__dirname, '/client/404.html'));
        return res.end();
    }

    const filePath = path.join(__dirname, '/client/cambiar_dades_treballador.html'); 


    // Lee el archivo
    fs.readFile(filePath, 'utf8', async (err, data) => {
        if (err) {
            return res.status(500).send('Error al leer el archivo');
        }

        const rol = await getRols(result[0].role, result[0].genere);

        /*
        Necessitem:
        Nom,
        Cognom,
        Genere,
        Hores contracte,
        Rol,
        Email,
        Horari
        */

        const jsonData = {
            id: result[0].id,
            nom: result[0].nom,
            cognom: result[0].cognom,
            genere: result[0].genere,
            hores_contracte: result[0].hores_contracte,
            role: result[0].role,
            email: result[0].email,
            horari: JSON.parse(result[0].horari),
        }
            
        const jsonString = JSON.stringify(jsonData);


        const scriptTag = `<script>
            const dades = ${jsonString};
        </script>`;

        const modifiedData = `${scriptTag}\n${data}`;

        res.setHeader('Content-Type', 'text/html');
        res.send(modifiedData);
    });
})

app.post('/admin/api/cambiar-dades', async (req, res) => {
    if (!req.session.userId || !req.session.admin == 1) {
        res.redirect('/login');
        return res.end();
    }

    if (!req.body.id) {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    const { nom, cognom, genere, hores_contracte, role, email, horari } = req.body;

    if (!nom || !cognom || !genere || !hores_contracte || !role || !email || !horari) {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    if (isNaN(hores_contracte) || hores_contracte < 0) {
        res.status(400).json({type: 'error', message: 'Hores contracte invàlides'});
        return res.end();
    }

    if (isNaN(role) || role < 0) {
        res.status(400).json({type: 'error', message: 'Rol invàlid'});
        return res.end();
    }

    const sql = "UPDATE users SET nom = ?, cognom = ?, genere = ?, hores_contracte = ?, role = ?, email = ?, email_notificacions = ?, horari = ? WHERE id = ?";
    await pool.query(sql, [nom, cognom, genere, hores_contracte, role, email, email, JSON.stringify(horari), req.body.id]);

    res.json({type: 'done', message: 'Dades actualitzades correctament'});
})

app.get('/admin/trajectes/:id', async (req, res) => {
    if (!req.session.userId || !req.session.admin == 1) {
        res.redirect('/login');
        return res.end();
    }

    const sql = "SELECT * FROM users WHERE id = ?";
    const result = await pool.query(sql, [req.params.id])

    if (result.length == 0) {
        res.sendFile(path.join(__dirname, '/client/404.html'));
        return res.end();
    }

    const filePath = path.join(__dirname, '/client/trajectes.html');


    // Lee el archivo
    fs.readFile(filePath, 'utf8', async (err, data) => {
        if (err) {
            return res.status(500).send('Error al leer el archivo');
        }

        const rol = await getRols(result[0].role, result[0].genere);

        const trajectes = await getTrajectes(req.params.id);

        let totalKm = 0;
        trajectes.forEach(trajecte => {
            totalKm += trajecte.km;
        })

        const jsonData = {
            id: result[0].id,
            nom: result[0].nom,
            cognom: result[0].cognom,
            rol: result[0].role == -1 ? 'Inactiu' : (result[0].genere ? rol[0].nom_f : rol[0].nom_m),
            totalKm: totalKm,
            trajectes: trajectes,
            foto_perfil: result[0].foto_perfil,
        }
            
        const jsonString = JSON.stringify(jsonData);


        const scriptTag = `<script>
            const dades = ${jsonString};
        </script>`;

        const modifiedData = `${scriptTag}\n${data}`;

        res.setHeader('Content-Type', 'text/html');
        res.send(modifiedData);
    });
})

app.get('/admin/api/hores/:id', async (req, res) => {
    if (!req.session.userId || !req.session.admin) {
        res.redirect('/login');
        return res.end();
    }

    const sql = "SELECT * FROM users WHERE id = ?";
    const result = await pool.query(sql, [req.params.id])

    if (result.length == 0) {
        res.json({type: 'error', message: 'Usuari no trobat'});
        return res.end();
    }

    /*
    from YYYY-MM-DD
    to YYYY-MM-DD
    */

    const { from, to } = req.query;
    if (!from || !to) {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }
    
    const sqlHorarisValidats = `SELECT * FROM horaris_validats WHERE user_id = ? AND dia >= ? AND dia <= ?`;
    const horarisValidats = await pool.query(sqlHorarisValidats, [req.params.id, from, to]);

    const sqlAbsencies = `SELECT * FROM absencies WHERE user_id = ? AND dia >= ? AND dia <= ?`;
    const absencies = await pool.query(sqlAbsencies, [req.params.id, from, to]);

    const sqlDiesPendents = `SELECT * FROM dies_pendents WHERE user_id = ? AND dia >= ? AND dia <= ?`;
    const diesPendents = await pool.query(sqlDiesPendents, [req.params.id, from, to]);

    const regularitzacions = await getRegularitzacions(req.params.id, from, to);

    res.json({hores_validades: horarisValidats, absencies: absencies, dies_pendents: diesPendents, regularitzacions});
})

app.get('/admin/hores/:id', async (req, res) => {
    if (!req.session.userId || !req.session.admin) {
        res.redirect('/login');
        return res.end();
    }

    const sql = "SELECT * FROM users WHERE id = ?";
    const result = await pool.query(sql, [req.params.id])

    if (result.length == 0) {
        res.sendFile(path.join(__dirname, '/client/404.html'));
        return res.end();
    }

    const filePath = path.join(__dirname, '/client/hores.html');

    // Lee el archivo
    fs.readFile(filePath, 'utf8', async (err, data) => {
        if (err) {
            return res.status(500).send('Error al leer el archivo');
        }

        const rol = await getRols(result[0].role, result[0].genere);

        const hores_validades = await getHoresValidades(req.params.id);
        const absencies = await getAbsencies(req.params.id);
        const diesPendents = await getDiesPendents(req.params.id);
        const regularitzacions = await getRegularitzacions(req.params.id);

        const jsonData = {
            id: result[0].id,
            nom: result[0].nom,
            cognom: result[0].cognom,
            rol: result[0].role == -1 ? 'Inactiu' : (result[0].genere ? rol[0].nom_f : rol[0].nom_m),
            absencies: absencies,
            hores_validades: hores_validades,
            dies_pendents: diesPendents,
            balançHores: await calcularBalançHores(req.params.id),
            foto_perfil: result[0].foto_perfil,
            regularitzacions: regularitzacions,
        }
            
        const jsonString = JSON.stringify(jsonData);

        const scriptTag = `<script>
            const dades = ${jsonString};
        </script>`;

        const modifiedData = `${scriptTag}\n${data}`;

        res.setHeader('Content-Type', 'text/html');
        res.send(modifiedData);
    });
})

app.post('/admin/eliminar-registre', async (req, res) => {
    if (!req.session.userId || !req.session.admin) {
        res.redirect('/login');
        return res.end();
    }

    if (!req.body.id || typeof req.body.id != 'object') {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    // type = 0 -> hores validades
    // type = 1 -> absencies
    // type = 2 -> dies pendents
    // type = 3 -> regularitzacions

    const sql = "DELETE FROM ?? WHERE id = ?";
    for (var i = 0; i < req.body.id.length; i++) {
        await pool.query(sql, [req.body.id[i].type == 0 ? 'horaris_validats' : (req.body.id[i].type == 1 ? 'absencies' : (req.body.id[i].type == 2 ? 'dies_pendents' : 'regularitzacions')), req.body.id[i].id]);
    }

    res.json({type: 'done', message: 'Registres eliminats correctament'});
})

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
        if (result[0].actiu == 0) {
            res.json({type: 'error', message: 'Aquest usuari està donat de baixa'});
            return res.end();
        }

        const sql = "SELECT * FROM rols WHERE id = ?";
        const result2 = await pool.query(sql, [result[0].role]);
        
        req.session.userId = result[0].id;
        req.session.role = result[0].role;   
        req.session.admin = !!result2[0].is_admin; //hell yeah

        console.log(!!result2[0].is_admin)

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
    
    let horari_anterior = false
    //Revisa si l'horari d'avui ja ha estat validat
    if (!req.query.dia) {
        var avui = new Date();
           
    } else {
        try {
            const [day, month, year] = req.query.dia.split('-');
            var avui = adjustTimezone(new Date(year, month - 1, day).toISOString());
            horari_anterior = avui < new Date();

            if (avui > new Date()) {
                res.status(400).json({type: 'error', message: 'No pots validar un horari d\'un dia futur'});
                return res.end();
            }
        } catch (e) {
            res.status(400).json({type: 'error', message: 'Dia invàlid'});
            return res.end();
        }              
    }
    //const avui = req.query.dia ? new Date(req.query.dia) : new Date();
    
    const jaValidatResult = await jaValidat(req.session.userId, avui.toISOString().slice(0, 10));

    if (jaValidatResult[0]) {
        const horari = jaValidatResult[1];
        const hourCount = contarHores(horari);
        res.json({horari: horari, horesTotals: hourCount, horariValidat: jaValidatResult[0], absencia: jaValidatResult[2], motiu: jaValidatResult[3]});
        return res.end();
    }

    const sql = `SELECT * FROM users WHERE id = ${req.session.userId}`;
    const result = await pool.query(sql);
    let horari = JSON.parse(result[0].horari);

    if (!horari_anterior) {
        res.json({horari: horariAvui(horari, avui.getDay()), horesTotals: contarHores(horariAvui(horari, avui.getDay()))});
        return res.end();

    } else {
        const sql2 = "SELECT * FROM dies_pendents WHERE user_id = ? AND dia = ?";
        const result2 = await pool.query(sql2, [req.session.userId, avui.toISOString().slice(0, 10)]);

        horari = result2.length == 0 ? horariAvui(horari, avui.getDay()) : JSON.parse(result2[0].horari_esperat);
        res.json({horari: horari, horesTotals: contarHores(horari)});
        return res.end();
    }
});

app.post('/validar-horari', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    //Per saber si estem validant el dia d'avui o el d'un dia anterior
    let diaAnterior = false;
    try {
        const [dia, mes, any] = req.body.dia.split('-');
        if (req.body.dia) {
            var avui = `${any}-${mes}-${dia}`;

            if (new Date(avui) < new Date()) {
                diaAnterior = true; // Guardem a algun lloc que el que estem validant és un dia passat
            }

            if (new Date(avui) > new Date()) {
                res.status(400).json({type: 'error', message: 'No pots validar un horari d\'un dia futur'});
                return res.end();
            }

        } else {
            var avui = new Date().toISOString().slice(0, 10);
        }

    } catch (e) {
        console.log(e);
        res.status(400).json({type: 'error', message: 'Dia invàlid'});
        return res.end();
    }

    // L'horari esperat dependra de si estem validant el dia d'avui o no

    // Si és un dia passat primer mirarem si existeix un dia pendent amb aquell dia
    // si no existeix mirarem l'horari actual de l'usuari

    if (!diaAnterior) {
        var horari_esperat = horariAvui(await getHorari(req.session.userId), new Date(avui).getDay());
    } else {
        const sql3 = "SELECT * FROM dies_pendents WHERE user_id = ? AND dia = ?";
        const result3 = await pool.query(sql3, [req.session.userId, avui]);

        if (result3.length == 0) {
            var horari_esperat = horariAvui(await getHorari(req.session.userId), new Date(avui).getDay()); // Com que no ha trobat cap dia pendent de validar, mirarem quin és el que tenia per aquell dia
        } else {
            var horari_esperat = JSON.parse(result3[0].horari_esperat);
        }
    }

    var horari = !req.body.horari ? horari_esperat : req.body.horari;

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

    let jaValidatResult = await jaValidat(req.session.userId, avui)
    
    //Comprova que no s'hagi validat ja l'horari d'avui
    if (jaValidatResult[0]) {
        res.status(400).json({type: 'error', message: 'Ja has validat l\'horari avui'});
        return res.end();
    }

    const sql2 = `INSERT INTO horaris_validats (user_id, dia, horari, horari_esperat) VALUES (${req.session.userId}, '${avui}', '${JSON.stringify(horari)}', '${JSON.stringify(horari_esperat)}')`;
    await pool.query(sql2);

    await eliminarDiesPendents(req.session.userId, avui);

    res.json({type: 'done', message: 'Horari validat correctament'});      
})

app.post('/absencia', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    //comprova que no s'hagi validat ja l'horari d'avui
    try {
        const [dia, mes, any] = req.body.dia.split('-');
        var avui = req.body.dia ? `${any}-${mes}-${dia}` : new Date().toISOString().slice(0, 10);
    } catch (e) {
        console.log(e);
        res.status(400).json({type: 'error', message: 'Dia invàlid'});
        return res.end();
    }

    let jaValidatResult = await jaValidat(req.session.userId, avui)
    
    if (jaValidatResult[0]) {
        res.status(400).json({type: 'error', message: 'Ja has validat l\'horari avui'});
        return res.end();
    }

    /*
    1: Festiu              -> Computen igual
    2: Canvi de torn
    3: Personal
    4: Absentisme
    5: Baixa mèdica         
    6: Permís retribuït     -> Computen igual
    7: Vacances             -> Computen igual
    */
    const { motiu } = req.body;

    if (!motiu ||(motiu < 1 || motiu > 7) || isNaN(motiu)) {
        res.status(400).json({type: 'error', message: 'Motiu invàlid'});
        return res.end();
    }

    const horariEsperat = horariAvui(await getHorari(req.session.userId), new Date(avui).getDay());
    
    if (!horariEsperat) {
        res.status(400).json({type: 'error', message: 'No tens cap horari programat per avui'});
        return res.end();
    }

    let computenHores = false;

    //Casos en els que no hem de restar les hores realitzades
    if (motiu == 1 || motiu == 6 || motiu == 7) computenHores = true;

    const sql3 = `INSERT INTO absencies (user_id, dia, motiu, horari_esperat, computen) VALUES (${req.session.userId}, '${avui}', '${motiu}', '${JSON.stringify(horariEsperat)}', ${+computenHores})`;
    await pool.query(sql3);

    await eliminarDiesPendents(req.session.userId, avui);

    res.json({type: 'done', message: 'Absència notificada correctament'});
})

app.get('/registre-mensual', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    const { mes, any } = req.query;

    if (!mes || !any) {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    //last: `SELECT * FROM horaris_validats WHERE user_id = ${req.session.userId} AND MONTH(dia) = MONTH(CURRENT_DATE()) AND YEAR(dia) = YEAR(CURRENT_DATE())`;
    const sql = "SELECT * FROM horaris_validats WHERE user_id = ? AND MONTH(dia) = ? AND YEAR(dia) = ?";
    const result = await pool.query(sql, [req.session.userId, mes, any]);

    const sql2 = "SELECT * FROM absencies WHERE user_id = ? AND MONTH(dia) = ? AND YEAR(dia) = ?";
    const result2 = await pool.query(sql2, [req.session.userId, mes, any]);

    /*
    [{
        dia: 
        horari:
        validat: true/false //false significa absencia
        motiu: null o motiu
        hores: hores realitzades
    }]
    */

    let toReturn = [];
    for (var i = 0; i < result.length; i++) {
        const horari = JSON.parse(result[i].horari);
        const hores = contarHores(horari);
        const dia = new Date(adjustTimezone(result[i].dia)).toISOString().slice(0, 10);
        toReturn.push({dia: dia, horari: horari, validat: true, motiu: null, hores: hores});
    }
    for (var i = 0; i < result2.length; i++) {
        const horari = JSON.parse(result2[i].horari_esperat);
        const dia = new Date(adjustTimezone(result2[i].dia)).toISOString().slice(0, 10);
        toReturn.push({dia: dia, horari: horari, validat: false, motiu: result2[i].motiu, hores: 0});
    }

    return res.json(toReturn);
})

app.get('/dies-pendents', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    const sql = `SELECT * FROM dies_pendents WHERE user_id = ${req.session.userId}`;
    const result = await pool.query(sql);

    let toReturn = [];
    for (var i = 0; i < result.length; i++) {
        const horari = JSON.parse(result[i].horari_esperat);
        const dia = new Date(adjustTimezone(result[i].dia)).toISOString().slice(0, 10);
        toReturn.push({dia: dia, horari: horari});
    }

    return res.json(toReturn);
})

app.get('/regularitzacions', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    const sql1 = "SELECT * FROM regularitzacions WHERE treballador_id = ?";
    const regularitzacions = await pool.query(sql1, [req.session.userId]);

    const sql2 = "SELECT * FROM dies_pendents WHERE user_id = ?";
    const diesPendents = await pool.query(sql2, [req.session.userId]);

    const sql3 = "SELECT * FROM absencies WHERE user_id = ?";
    const absencies = await pool.query(sql3, [req.session.userId]);

    const sql4 = "SELECT * FROM horaris_validats WHERE user_id = ?";
    const horarisValidats = await pool.query(sql4, [req.session.userId]);

    res.json({
        regularitzacions: regularitzacions, 
        diesPendents: diesPendents, 
        absencies: absencies, 
        horarisValidats: horarisValidats
    });
})

app.get('/perfil', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    /*
    Retorna:
    
    data de l'alta
    hores setmanals esperades
    balanç d'hores extres
    */

    const sql = `SELECT * FROM users WHERE id = ${req.session.userId}`;
    const result = await pool.query(sql);
    const [any, mes, dia] = adjustTimezone(result[0].alta).toISOString().slice(0, 10).split('-');
    const dataAlta = `${dia}/${mes}/${any}`;

    const horesSetmanals = calcularHoresSetmanals(JSON.parse(result[0].horari));

    const balançHores = await calcularBalançHores(req.session.userId);

    const nom = result[0].nom;
    const cognom = result[0].cognom;

    const sql2 = "SELECT * FROM rols WHERE id = ?";
    const result2 = await pool.query(sql2, [result[0].role]);

    if (result[0].genere) {
        var rol = result2[0].nom_f;
    } else {
        var rol = result2[0].nom_m;
    }
   

    res.json({dataAlta: dataAlta, horesSetmanals: horesSetmanals, balançHores: balançHores, fotoPerfil: result[0].foto_perfil, nom: nom, cognom: cognom, rol: rol});
})

app.get('/admin/api/rols', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    const sql = "SELECT * FROM rols";
    const result = await pool.query(sql);

    res.json(result);
})

app.post('/admin/api/registrar-treballador', async (req, res) => {
    if (!req.session.userId || !req.session.admin) {
        res.redirect('/login');
        return res.end();
    }

    const { nom, cognom, genere, hores_mensuals, rol, email, password, horari } = req.body;

    if (!nom || !cognom || !genere || !hores_mensuals || !rol || !email || !password || !horari) {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    if (isNaN(hores_mensuals) || hores_mensuals < 0) {
        res.status(400).json({type: 'error', message: 'Hores mensuals invàlides'});
        return res.end();
    }

    if (isNaN(genere) || (genere != 0 && genere != 1)) {
        res.status(400).json({type: 'error', message: 'Gènere invàlid'});
        return res.end();
    }

    const hash = crypto.createHash('sha256').update(password).digest('hex');

    const sql2 = "SELECT * FROM users WHERE email = ?";
    const result2 = await pool.query(sql2, [email]);

    if (result2.length > 0) {
        res.status(400).json({type: 'error', message: 'Ja existeix un usuari amb aquest email'});
        return res.end();
    }

    const sql = "INSERT INTO users (nom, cognom, role, email, email_notificacions, pass, horari, genere, hores_contracte) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    await pool.query(sql, [nom, cognom, rol, email, email, hash, JSON.stringify(horari), genere, hores_mensuals]);
    res.json({type: 'done', message: 'Treballador registrat correctament'});
})

app.post('/afegir-trajecte', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }
    /* Necessita:
        - dia (YYYY-MM-DD)
        - origen (string)
        - destí (string)
        - km (float)
    */

    const { dia, origen, desti, km } = req.body;
    if (!dia || !origen || !desti || !km) {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    if (isNaN(km) || km < 0) {
        res.status(400).json({type: 'error', message: 'Kilometratge invàlid'});
        return res.end();
    }

    const date = new Date(dia);
    if (date.toString() === 'Invalid Date' || date > new Date()) {
        res.status(400).json({type: 'error', message: 'Data invàlida'});
        return res.end();
    }

    const sql = "INSERT INTO trajectes (user_id, dia, origen, desti, km) VALUES (?, ?, ?, ?, ?)";
    await pool.query(sql, [req.session.userId, date.toISOString().split('T')[0], origen, desti, km]);
    res.json({type: 'done', message: 'Trajecte afegit correctament'});
})

app.post('/cambiar-notificacions', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    if (isNaN(req.body.notificacions)) {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    const sql = "UPDATE users SET enviar_notificacions = ? WHERE id = ?";
    await pool.query(sql, [+req.body.notificacions, req.session.userId]);
    res.json({type: 'done', message: 'Notificacions actualitzades'});
})

app.get('/rebre-notificacions', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    const sql = `SELECT * FROM users WHERE id = ${req.session.userId}`;
    const result = await pool.query(sql);

    res.json({notificacions: !!result[0].enviar_notificacions});
})

app.post('/canviar-contrasenya', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    const { oldPass, newPass } = req.body;

    if (!oldPass || !newPass) {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    const sql = "SELECT * FROM users WHERE id = ?";
    const result = await pool.query(sql, [req.session.userId]);

    const hash = crypto.createHash('sha256').update(oldPass).digest('hex');
    if (hash != result[0].pass) {
        res.status(400).json({type: 'error', message: 'Contrasenya actual incorrecta'});
        return res.end();
    }

    const newHash = crypto.createHash('sha256').update(newPass).digest('hex');
    const sql2 = "UPDATE users SET pass = ? WHERE id = ?";
    await pool.query(sql2, [newHash, req.session.userId]);

    res.json({type: 'done', message: 'Contrasenya canviada correctament'});
})

app.post('/canviar-email', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }

    const { email } = req.body;

    if (!email) {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    if (!email.match(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/)) {
        res.status(400).json({type: 'error', message: 'Email invàlid'});
        return res.end();
    }

    const sql = "UPDATE users SET email_notificacions = ? WHERE id = ?";
    var result = await pool.query(sql, [email, req.session.userId]);

    res.json({type: 'done', message: 'Email canviat correctament'});
})

app.get('/trajectes', async (req, res) => {
    if (!req.session.userId) {
        res.redirect('/login');
        return res.end();
    }
    
    const sql = "SELECT * FROM trajectes WHERE user_id = ?";
    const result = await pool.query(sql, [req.session.userId]);
    

    let toReturn = [];
    for (var i = 0; i < result.length; i++) {
        const dia = new Date(adjustTimezone(result[i].dia)).toISOString().slice(0, 10);
        let hasFound = false;

        for (var j = 0; j < toReturn.length; j++) {
            if (toReturn[j].dia == dia) {
                hasFound = true;

                toReturn[j].trajectes.push({id: result[i].id, origen: result[i].origen, desti: result[i].desti, km: result[i].km, pagat: !!result[i].pagat});
                break //Busca a veure si ja hi ha multiples viatges en un mateix dia
            }
        }

        if (!hasFound) {
            toReturn.push({dia: dia, trajectes: [{id: result[i].id, origen: result[i].origen, desti: result[i].desti, km: result[i].km, pagat: !!result[i].pagat}]});
        }
    }

    return res.json(toReturn);
})

app.get('/treballadors', async (req, res) => {
    if (!req.session.userId || !req.session.admin) {
        res.redirect('/login');
        return res.end();
    }

    if (!req.query.query) {
        const sql = "SELECT * FROM users"
        var result = await pool.query(sql);
    } else {
        const sql = `SELECT * FROM users WHERE nom LIKE '%${req.query.query}%' OR cognom LIKE '%${req.query.query}%'`
        var result = await pool.query(sql);
    }
    
    const sql2 = "SELECT * FROM rols"
    const result2 = await pool.query(sql2);

    let toReturn = [];
    for (var i = 0; i < result.length; i++) {
        /*
        Response:
        ID
        Nom
        Cognom
        Rol (nom)
        Hores setmanals
        Balanç d'hores
        Estat (si rol és -1 o no)
        */

        const rol = result2.find(x => x.id == result[i].role);
        const horesSetmanals = calcularHoresSetmanals(JSON.parse(result[i].horari));
        const balançHores = await calcularBalançHores(result[i].id);

        toReturn.push({
            id: result[i].id, 
            nom: result[i].nom, 
            cognom: result[i].cognom, 
            rol: result[i].actiu == 0 ? 'Inactiu' : (result[i].genere ? rol.nom_f : rol.nom_m), 
            horesSetmanals: horesSetmanals, 
            balançHores: balançHores, 
            estat: !result[i].actiu // True si està donat de baixa
        });
    }

    return res.json(toReturn);
})

app.post('/admin/pagar-trajecte', async (req, res) => {
    if (!req.session.userId || !req.session.admin) {
        res.redirect('/login');
        return res.end();
    }

    if (!req.body.id || typeof req.body.id != 'object') {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    const sql = "UPDATE trajectes SET pagat = 1 WHERE id = ?";
    for (var i = 0; i < req.body.id.length; i++) {
        await pool.query(sql, [req.body.id[i]]);
    }

    res.json({type: 'done', message: 'Trajectes pagats correctament'});
})

app.post('/admin/eliminar-trajecte', async (req, res) => {
    if (!req.session.userId || !req.session.admin) {
        res.redirect('/login');
        return res.end();
    }

    if (!req.body.id || typeof req.body.id != 'object') {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    const sql = "DELETE FROM trajectes WHERE id = ?";
    for (var i = 0; i < req.body.id.length; i++) {
        await pool.query(sql, [req.body.id[i]]);
    }

    res.json({type: 'done', message: 'Trajectes eliminats correctament'});
})

app.post('/admin/regularitzar-hores', async (req, res) => {
    if (!req.session.userId || !req.session.admin) {
        res.redirect('/login');
        return res.end();
    }

    if (!req.body.treballador_id || !req.body.amount) {
        res.status(400).json({type: 'error', message: 'Falten dades'});
        return res.end();
    }

    const sql = "INSERT INTO regularitzacions (treballador_id, hores, admin_id) VALUES (?, ?, ?)";
    await pool.query(sql, [req.body.treballador_id, req.body.amount, req.session.userId]);

    res.json({type: 'done', message: 'Hores regularitzades correctament'});
})

function calcularHoresSetmanals(horari) {
    let count = 0;
    for (var i = 0; i < horari.length; i++) {
        count += contarHores(horari[i].horari);
    }
    return count;
}

async function calcularBalançHores(user_id) {
    const horari = await getHorari(user_id);

    const sql1 = `SELECT * FROM horaris_validats WHERE user_id = ${user_id}`;
    const horesRealitzades = await pool.query(sql1);

    const sql2 = `SELECT * FROM absencies WHERE user_id = ${user_id}`;
    const absencies = await pool.query(sql2);


    const sql3 = `SELECT * FROM dies_pendents WHERE user_id = ${user_id}`;
    const diesPendents = await pool.query(sql3);

    const sql4 = `SELECT * FROM regularitzacions WHERE treballador_id = ${user_id}`;
    const regularitzacions = await pool.query(sql4);

    let horesTotals = 0;
    for (var i = 0; i < horesRealitzades.length; i++) {
        const horari = JSON.parse(horesRealitzades[i].horari);

        //el balanç d'hores s'ha de calcular sumant les hores que s'han fet menys les que s'havien de fer
        horesTotals += contarHores(horari) - contarHores(JSON.parse(horesRealitzades[i].horari_esperat));
    }

    for (var i = 0; i < absencies.length; i++) {
        if (!absencies[i].computen) { //revisa si s'han de pagar o no
            const horari = JSON.parse(absencies[i].horari_esperat);
            horesTotals -= contarHores(horari);  
        }
    }

    for (var i = 0; i < diesPendents.length; i++) {
        const horari = JSON.parse(diesPendents[i].horari_esperat);  
        horesTotals -= contarHores(horari);
    }

    for (var i = 0; i < regularitzacions.length; i++) {
        horesTotals -= regularitzacions[i].hores;
    }

    return horesTotals;
}

function eliminarDiesPendents(user_id, dia) {
    const sql = `DELETE FROM dies_pendents WHERE user_id = ${user_id} AND dia = '${dia}'`;
    pool.query(sql);
}

async function getDiesPendents(user_id) {
    const sql = `SELECT * FROM dies_pendents WHERE user_id = ${user_id}`;
    const result = await pool.query(sql);
    return result;
}

async function getAbsencies(user_id) {
    const sql = `SELECT * FROM absencies WHERE user_id = ${user_id}`;
    const result = await pool.query(sql)
    return result;
}

async function getHoresValidades(user_id) {
    const sql = `SELECT * FROM horaris_validats WHERE user_id = ${user_id}`;
    const result = await pool.query(sql);
    return result;
}
//Busca l'horari que toca el dia d'avui
function horariAvui(horari, avui=new Date().getDay()) {
    for (var i = 0; i < horari.length; i++) {
        if (horari[i].dia == avui) {
            return horari[i].horari;
        }
    }

    return [];
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

async function getRegularitzacions(user_id, from=null, to=null) {
    if (from && to) {
        const sql = "SELECT regularitzacions.id, users.nom, regularitzacions.hores, regularitzacions.dia FROM regularitzacions JOIN users ON regularitzacions.admin_id = users.id WHERE treballador_id = ? AND dia >= ? AND dia <= ?"
        const result = await pool.query(sql, [user_id, from, to])
        return result;
    }

    const sql = "SELECT regularitzacions.id, users.nom, regularitzacions.hores, regularitzacions.dia FROM regularitzacions JOIN users ON regularitzacions.admin_id = users.id WHERE treballador_id = ?"
    const result = await pool.query(sql, [user_id])
    return result;
}

async function getHorari(user_id) {
    const sql = `SELECT * FROM users WHERE id = ${user_id}`;
    const result = await pool.query(sql);
    return JSON.parse(result[0].horari);
}

/*Retorna un array:
[0]: Si ja ha validat o marcat absència en l'horari
[1]: Retorna l'horari validat
[2]: Retorna si és una absència o no
[3]: Retorna el motiu de l'absència
*/
async function jaValidat(user_id, dia) {
    const sql = `SELECT * FROM absencies WHERE user_id = ${user_id} AND dia = '${dia}'`;
    const result = await pool.query(sql);
    
    if (result.length > 0) {
        return [true, [], true, result[0].motiu];
    }

    const sql2 = `SELECT * FROM horaris_validats WHERE user_id = ${user_id} AND dia = '${dia}'`;
    const result2 = await pool.query(sql2);
    if (result2.length > 0) {
        return [true, JSON.parse(result2[0].horari), false, null];
    }

    return [false, null, null, null];
}

function adjustTimezone(dateString) {
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - userTimezoneOffset);
    return localDate;
}

async function buscarUsuarisQueNoHanValidat() {
    const today = new Date();
    const yesterday = new Date(today);

    yesterday.setDate(today.getDate() - 1);
    const dia = yesterday.toISOString().slice(0, 10);

    const sql = `SELECT * FROM users`;
    const result = await pool.query(sql);

    let usuarisAValidar = []
    for (var i = 0; i < result.length; i++) {
        const horari = JSON.parse(result[i].horari)
        for (var j = 0; j < horari.length; j++) {
            if (yesterday.getDay() == horari[j].dia) {
                usuarisAValidar.push({user_id: result[i].id, horari_esperat: horari[j].horari})
                break
            }
        }
    }

    for (var i = 0; i < usuarisAValidar.length; i++) {
        const sql = `SELECT * FROM horaris_validats WHERE user_id = ${usuarisAValidar[i].user_id} AND dia = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
        const result = await pool.query(sql)
        if (result.length > 0) continue

        const sql2 = `SELECT * FROM absencies WHERE user_id = ${usuarisAValidar[i].user_id} AND dia = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`
        const result2 = await pool.query(sql2)
        if (result2.length > 0) continue

        //revisa si a dies pendents ja ha estat afegit
        const sql4 = "SELECT * FROM dies_pendents WHERE user_id = ? AND dia = DATE_SUB(CURDATE(), INTERVAL 1 DAY)"
        const result4 = await pool.query(sql4, [usuarisAValidar[i].user_id])
        if (result4.length > 0) continue

        const sql3 = `INSERT INTO dies_pendents (user_id, dia, horari_esperat) VALUES (${usuarisAValidar[i].user_id}, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '${JSON.stringify(usuarisAValidar[i].horari_esperat)}')`
        await pool.query(sql3)
    }
}

async function getRols(id) {
    const sql2 = "SELECT * FROM rols WHERE id = ?";
    const result2 = await pool.query(sql2, [id])

    return result2;
}

async function getTrajectes(id) {
    const sql = `SELECT * FROM trajectes WHERE user_id = ?`;
    const result = await pool.query(sql, [id]);

    return result;
}

//Cada dia a les 2:10 de la nit es revisara qui no ha validat l'horari
cron.schedule('10 2 * * *', () => {
    buscarUsuarisQueNoHanValidat();
}, {
    timezone: 'Europe/Madrid' // Ajusta la zona horaria según sea necesario
});

buscarUsuarisQueNoHanValidat();