// === initialization start === //
const express = require('express');
const {Client} = require('pg'); 
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


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
  const { server_ip, server_username, server_password, server_database } = req.body;

  //inisialisasi koneksi
  const client = new Client({
    host: server_ip,
    user: server_username,
    password: server_password,
    database: server_database,
    port: 5432,
  });

  //jika terkoneksi
  client.connect()
    .then(() => {
      return client.query(`
        SELECT * 
        FROM distributor
        WHERE distributor_isactive = true
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

//view category
app.post('/categories', (req, res) => {
  const { server_ip, server_username, server_password, server_database } = req.body;

  //inisialisasi koneksi
  const client = new Client({
    host: server_ip,
    user: server_username,
    password: server_password,
    database: server_database,
    port: 5432,
  });

  //jika terkoneksi
  client.connect()
    .then(() => {
      return client.query(`
        SELECT * 
        FROM category
        WHERE category_isdeleted = false
      `);
    })
    .then((result) => {
      res.status(200).json({
        status: 'success',
        categories: result.rows, 
      });
    })
    .catch((err) => {
      res.status(500).json({
        status: 'failure',
        message: 'Failed to fetch categories: ' + err.message,
      });
    })
});
// === read endpoint end === //

// === read based on id endpoint start === //
app.post('/distributor-details', (req, res) => {
  const { server_ip, server_username, server_password, server_database, distributor_id} = req.body;

  const client = new Client({
    host: server_ip,
    user: server_username,
    password: String(server_password),
    database: server_database,
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

//fetch admin identity
app.post('/admin', (req, res) => {
  const { server_ip, server_username, server_password, server_database, admin_id} = req.body;

  const client = new Client({
    host: server_ip,
    user: server_username,
    password: String(server_password),
    database: server_database,
    port: 5432,
  });

  client.connect()
  .then(() => {
    return client.query('select * from admin where admin_id = $1', [admin_id]);
  })
  .then((result) => {
    if(result.rows.length === 0){
      return res.status(404).json({
        status: 'failure',
        message: 'Admin not found'
      });
    }

    res.status(200).json({
      status: 'success',
      admin: result.rows[0]
    });
  })
  .catch((err) => {
    res.status(500).json({
      status: 'failure',
      message: 'Failed to fetch admin details: ' + err.message,
    });
  })
});
// === read based on id endpoint end === //

// === update endpoint start === //
//edit pin for admin
app.post('/edit-pin', async (req, res) => {
  const { server_ip, server_username, server_password, server_database, admin_id, new_pin } = req.body;

  const client = new Client({
    host: server_ip,
    user: server_username,
    password: String(server_password),
    database: server_database,
    port: 5432,
  });

  try {
    await client.connect();  // Menggunakan async/await untuk penanganan koneksi yang lebih baik
 
    // Menggunakan crypt untuk hashing PIN sebelum disimpan
    await client.query(
      `UPDATE admin SET admin_pin = crypt($1, gen_salt('bf')) WHERE admin_id = $2`,
      [new_pin, admin_id]
    );

    res.status(200).json({
      status: 'success',
      message: 'Pin successfully updated'
    });

  } catch (err) {
    res.status(500).json({
      status: 'failure',
      message: 'Failed to edit pin: ' + err.message,
    });
  }
});

//edit distributor
app.post('/edit-distributor', async (req, res) => {
  const {
    server_ip,
    server_username,
    server_password,
    server_database,
    distributor_id,
    distributor_name,
    distributor_phone_number,
    distributor_email,
    distributor_ecommerce_link,
    distributor_change_detail,
    admin_pin,  // Admin pin sent from Flutter
  } = req.body;

  // Ensure all required fields are provided
  if (!server_ip || !server_username || !server_password || !server_database || !distributor_id || !admin_pin) {
    return res.status(400).json({
      status: 'failure',
      message: 'Missing required fields',
    });
  }

  const client = new Client({
    host: server_ip,
    user: server_username,
    password: String(server_password),
    database: server_database,
    port: 5432,
  });

  try {
    await client.connect();

    // 1. Verify admin pin by querying all admins and comparing each admin's pin
    const adminResult = await client.query(`SELECT * FROM admin`);
    const admins = adminResult.rows;

    let admin = null;

    // Loop through each admin and compare the provided pin with the stored hash
    for (const adminRecord of admins) {
      const isPinValid = await bcrypt.compare(admin_pin, adminRecord.admin_pin);  // Assuming admin_pin is the hashed pin
      if (isPinValid) {
        admin = adminRecord; // Admin found, break the loop
        break;
      }
    }

    if (!admin) {
      return res.status(400).json({
        status: 'failure',
        message: 'Admin pin is incorrect',
      });
    }

    // 2. Update distributor data
    await client.query(
      `UPDATE distributor 
       SET distributor_name = $1, distributor_phone_number = $2, distributor_email = $3, distributor_ecommerce_link = $4
       WHERE distributor_id = $5`,
      [distributor_name, distributor_phone_number, distributor_email, distributor_ecommerce_link, distributor_id]
    );

    // 3. Insert into distributorhistory with the admin_id
    await client.query(
      `INSERT INTO distributorhistory (distributor_id, admin_id, distributor_change_detail)
       VALUES ($1, $2, $3)`,
      [distributor_id, admin.admin_id, distributor_change_detail]
    );

    res.status(200).json({
      status: 'success',
      message: 'Distributor successfully updated and change history recorded',
    });

  } catch (err) {
    res.status(500).json({
      status: 'failure',
      message: 'Failed to update distributor: ' + err.message,
    });
  }
});
// === update endpoint end === //

// === delete endpoint start === //
app.post('/delete-distributor', async (req, res) => {
  const { server_ip, server_username, server_password, server_database, distributor_id } = req.body;

  try {
    // Membuat koneksi ke database
    const client = new Client({
      host: server_ip,
      user: server_username,
      password: String(server_password),
      database: server_database,
      port: 5432,
    });

    await client.connect();

    // Menghapus distributor berdasarkan ID
    const deleteResult = await client.query(
      'DELETE FROM distributor WHERE distributor_id = $1 RETURNING *',
      [distributor_id]
    );

    if (deleteResult.rowCount === 0) {
      return res.status(404).json({
        status: 'failure',
        message: 'Distributor tidak ditemukan',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Distributor berhasil dihapus',
      distributor: deleteResult.rows[0],
    });
  } catch (err) {
    res.status(500).json({
      status: 'failure',
      message: 'Terjadi kesalahan: ' + err.message,
    });
  }
});
// === delete endpoint end === //

// === delete endpoint end === //

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

//verify pin
app.post('/verify-pin', async (req, res) => {
  const { server_ip, server_username, server_password, server_database, admin_pin } = req.body;

  const client = new Client({
    host: server_ip,
    user: server_username,
    password: String(server_password),
    database: server_database,
    port: 5432,
  });

  try {
    await client.connect();

    // Ambil semua hash PIN dari database
    const result = await client.query('SELECT admin_pin FROM admin');
    const admins = result.rows;

    // Iterasi untuk mencocokkan input PIN dengan hash PIN
    let isMatch = false;
    for (const admin of admins) {
      if (await bcrypt.compare(admin_pin, admin.admin_pin)) {
        isMatch = true;
        break; // Berhenti jika ada yang cocok
      }
    }

    if (!isMatch) {
      return res.status(401).json({
        status: 'failure',
        message: 'Admin PIN tidak valid',
      });
    }

    // Kirim token atau respon sukses
    res.status(200).json({
      status: 'success',
      message: 'Verifikasi berhasil',
    });
  } catch (err) {
    res.status(500).json({
      status: 'failure',
      message: 'Terjadi kesalahan: ' + err.message,
    });
  }
});
// === misc endpoint end === //

//memulai server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});


