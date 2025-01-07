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
//view distributor
app.post('/distributors', (req, res) => {
  const { servername, username, password, database } = req.body;

  //inisialisasi koneksi
  const client = new Client({
    host: servername,
    user: username,
    password: password,
    database: database,
    port: 5432,
  });

  //jika terkoneksi
  client.connect()
    .then(() => {
      return client.query(`
          SELECT * 
          FROM distributor
        `);
    })
    .then((result) => {
      res.status(200).json({
        status: 'success',
        distributors: result.rows, 
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: 'failure',
        message: 'Failed to fetch distributors: ' + err.message,
      });
    })
});
// === read endpoint end === //

// === read based on id endpoint start === //
app.post('/distributor-details', (req, res) => {
  const { servername, username, password, database, distributor_id} = req.body;

  const client = new Client({
    host: servername,
    user: username,
    password: String(password),
    database: database,
    port: 5432,
  });

  //jika terkoneksi
  client.connect()
    .then(() => {
      return client.query(`
        SELECT * FROM distributor WHERE distributor_id = $1
      `, [distributor_id]);
    })
    .then((result) => {
      res.status(200).json({
        status: 'success',
        distributor: result.rows[0],
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: 'failure',
        message: 'Failed to fetch distributors: ' + err.message,
      });
    })
});
// === read based on id endpoint end === //

// === update endpoint start === //

// === update endpoint end === //

// === delete endpoint start === //

// === delete endpoint end === //

// === misc endpoint start === //
//verify admin to setting
app.post('/verify-admin', async (req, res) => {
  const { server_ip, server_username, server_password, server_database, admin_username, admin_password } = req.body;

  const client = new Client({
    host: server_ip,
    user: server_username,
    password: String(server_password),
    database: server_database,
    port: 5432,
  });

  try {
    await client.connect(); // Properly waiting for the connection to establish

    // Query untuk mencari admin berdasarkan username
    const result = await client.query('SELECT * FROM admin WHERE admin_username = $1', [admin_username]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        status: 'failure',
        message: 'Admin user not found',
      });
    }

    const admin = result.rows[0];

    // Verifikasi password menggunakan bcrypt
    // const isMatch = await compare(admin_password, admin.admin_password);

    if (admin_password === admin.admin_password) {
      // Verifikasi berhasil, kirim data admin dalam response
      return res.status(200).json({
        status: 'success',
        message: 'Admin verified successfully',
        admin: {
          admin_id: admin.admin_id,  // Kirimkan id_admin sebagai integer
          admin_username: admin.admin_username,  // Pastikan mengirimkan username_admin yang benar
        },
      });
    } else {
      return res.status(401).json({
        status: 'failure',
        message: 'Incorrect password',
      });
    }
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).json({
      status: 'failure',
      message: 'Internal server error: ' + err.message,
    });
  }
});
// === misc endpoint end === //

//memulai server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});


