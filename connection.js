// === initialization start === //
const express = require('express');
const {Client} = require('pg'); 
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');


const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: '123',
    resave: false,
    saveUninitialized: true,
}));
// === initialization end === //

// === database login start === //
app.post('/connect', (req, res) => {
    //request ke dalam body flutter
    const { server_ip, server_username, server_password, server_database } = req.body;

    if (!server_ip || !server_username || !server_password || !server_database) {
        return res.status(400).json({
            status: 'failure',
            message: 'Please provide all required fields: servername, username, password, database.',
        });
    }

    //inisialisasi
    client = new Client({
        host: server_ip,
        user: server_username,
        password: server_password,
        database: server_database,
        port: 5432,
    });

    //koneksi inputan client ke database
    client.connect()
        .then(() => {
            //menyimpan session (hanya untuk chrome)
            req.session.server_ip = server_ip;
            req.session.server_username = server_username;
            req.session.server_password = server_password;
            req.session.server_database = server_database;

            return res.status(200).json({
                status: 'success',
                message: 'Successfully connected to the database!',
            });
        })
        .catch((err) => {
            return res.status(500).json({
                status: 'failure',
                message: 'Failed to connect to the database: ' + err.message,
            });
        });
});
// === database login end === //

// === database logout start === //

// === database logout end === //

// === create endpoint start === //

// === create endpoint end === //

// === read endpoint start === //

// === read endpoint end === //

// === update endpoint start === //

// === update endpoint end === //

// === delete endpoint start === //

// === delete endpoint end === //

// === misc endpoint start === //

// === misc endpoint end === //

//memulai server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});


