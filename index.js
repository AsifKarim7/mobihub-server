const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = process.env.Port || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rcmuwti.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send('unauthorized access');
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'forbidden access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        const phoneCollection = client.db('mobiHub').collection('mobileBrands');
        const categoryCollection = client.db('mobiHub').collection('brands');
        const ordersCollection = client.db('mobiHub').collection('orders');
        const usersCollection = client.db('mobiHub').collection('users');
        const advertisedCollection = client.db('mobiHub').collection('advertised');

        const paymentCollection = client.db('mobiHub').collection('payments');


        app.get('/category', async (req, res) => {
            const query = {}
            const cursor = categoryCollection.find(query);
            const categories = await cursor.toArray();
            res.send(categories);
        })

        app.get('/category/:categoryId', async (req, res) => {
            const categoryId = req.params.categoryId;
            const query = { categoryId: categoryId };
            const cursor = phoneCollection.find(query);
            const category = await cursor.toArray();
            res.send(category);
        })

        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = ordersCollection.find(query);
            const orders = await cursor.toArray();
            res.send(orders);
        })

        app.get('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const order = await ordersCollection.findOne(query);
            res.send(order);
        })

        app.post('/create-payment-intent', async (req, res) => {
            const order = req.body;
            const price = parseInt(order.price);
            const amount = parseInt(price * 100);

            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'usd',
                amount: amount,
                "payment_method_types": [
                    "card"
                ]
            });
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        });

        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment);
            const id = payment.orderId
            const filter = { _id: ObjectId(id) }
            const updatedDoc = {
                $set: {
                    paid: true,
                    transactionId: payment.transactionId
                }
            }
            const updatedResult = await ordersCollection.updateOne(filter, updatedDoc)
            res.send(result);
        })

        app.post('/orders', async (req, res) => {
            const booking = req.body;
            const result = await ordersCollection.insertOne(booking);
            res.send(result);
        })

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await usersCollection.findOne(query);
            if (user) {
                const token = jwt.sign({ email }, process.env.ACCESS_TOKEN, { expiresIn: '1h' })
                return res.send({ accessToken: token });
            }
            res.status(403).send({ accessToken: '' })
        })


        app.get('/users', async (req, res) => {
            const role = req.query.role;
            const query = { role };
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(query);
            res.send(result);
        })


        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isAdmin: user?.role === 'admin' })
        })

        app.get('/users/buyers/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isBuyer: user?.role === 'buyer' })
        })

        app.get('/users/sellers/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email }
            const user = await usersCollection.findOne(query);
            res.send({ isSeller: user?.role === 'seller' })
        })


        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })

        app.put('/users/admin/:id', async (req, res) => {

            const query = { email: req.query.email };
            const user = await usersCollection.findOne(query);
            if (user?.role === 'admin') {
                return res.status(403).send({ message: 'forbidden access' })
            }
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upset: true };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await usersCollection.updateOne(filter, updatedDoc, options);
            res.send(result);
        })

        app.post('/product', async (req, res) => {
            const product = req.body;
            const result = await phoneCollection.insertOne(product);
            res.send(result);
        })

        app.post('/advertisedProduct', async (req, res) => {
            const advertisedProduct = req.body;
            const result = await advertisedCollection.insertOne(advertisedProduct);
            res.send(result);
        })

        app.get('/advertisedProduct', async (req, res) => {
            const query = {}
            const cursor = advertisedCollection.find(query);
            const advertised = await cursor.toArray();
            res.send(advertised);
        })

        app.get('/myproducts', async (req, res) => {
            let query = {};
            if (req.query.email) {
                query = {
                    email: req.query.email
                }
            }
            const cursor = phoneCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        })

        app.delete('/myproducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await phoneCollection.deleteOne(query);
            res.send(result);
        })
    }
    finally {

    }
}
run().catch(error => console.error(error));


app.get('/', (req, res) => {
    res.send('mobihub server is running')
})

app.listen(port, () => {
    console.log(`mobihub server running on ${port}`);
})
