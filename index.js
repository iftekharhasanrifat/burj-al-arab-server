const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
const admin = require('firebase-admin');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.3ij59.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const app = express()
app.use(cors());
app.use(bodyParser.json());

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const port = 5000

var serviceAccount = require("./configs/burj-al-arab-a7473-firebase-adminsdk-bmvc5-0a6a86c995.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIRE_DB
});

client.connect(err => {
    const bookings = client.db("burjAlArab").collection("bookings");
    console.log('db connected successfully');

    app.post('/addBooking', (req, res) => {
        const newBooking = req.body;
        bookings.insertOne(newBooking)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
        console.log(newBooking);
    })

    app.get('/bookings', (req, res) => {
        const email = req.query.email;
        const bearer = req.headers.authorization;
        if (bearer && bearer.startsWith('Bearer ')) {
            const idToken = bearer.split(' ')[1];
            console.log({ idToken });
            admin.auth().verifyIdToken(idToken)
                .then((decodedToken) => {
                    const tokenEmail = decodedToken.email;
                    if (tokenEmail == req.query.email) {
                        bookings.find({ email: email })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else{
                        res.status(401).send('un-authorized access')
                    }
                })
                .catch((error) => {
                    res.status(401).send('un-authorized access')
                });
        }
        else {
            res.status(401).send('un-authorized access')
        }
    })
});

app.listen(port)