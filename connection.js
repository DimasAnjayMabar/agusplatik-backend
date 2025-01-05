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
//menghapus session dari node js (khusus untuk chrome dan web app)
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                status: 'failure',
                message: 'Failed to logout: ' + err.message,
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Logged out successfully.',
        });
    });
});
// === database logout end === //

// === create endpoint start === //
//tambah distributor baru
app.post('/new-distributor', (req, res) => {
    const { server_ip, server_username, server_password, server_database, distributor_name, distributor_phone_number, distributor_email, distributor_ecommerce_link } = req.body;
  
    const client = new Client({
      host: server_ip,
      user: server_username,
      password: server_password,
      database: server_database,
      port: 5432,
    });
  
    client.connect()
      .then(() => {
        return client.query(`
          INSERT INTO distributor (distributor_name, distributor_phone_number, distributor_email, distributor_ecommerce_link)
          VALUES ($1, $2, $3, $4)
          RETURNING *
        `, [distributor_name, distributor_phone_number, distributor_email, distributor_ecommerce_link]); 
      })
      .then((result) => {
        res.status(200).json({
          status: 'success',
          distributors: result.rows[0],
        });
      })
      .catch((err) => {
        res.status(500).json({
          status: 'failure',
          message: 'Failed to add distributor: ' + err.message,
        });
      })
  });
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


