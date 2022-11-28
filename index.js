const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.Port || 5000;

app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.rcmuwti.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const phoneCollection = client.db('mobiHub').collection('mobileBrands');
        const categoryCollection = client.db('mobiHub').collection('brands');
        const ordersCollection = client.db('mobiHub').collection('orders');
        const buyersCollection = client.db('mobiHub').collection('buyers');


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
        });

        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const orders = await ordersCollection.find(query).toArray();
            res.send(orders);
        })

        app.post('/orders', async (req, res) => {
            const booking = req.body;
            const result = await ordersCollection.insertOne(booking);
            res.send(result);
        })

        app.post('/buyers', async (req, res) => {
            const user = req.body;
            console.log(user);
            const result = await buyersCollection.insertOne(user);
            res.send(result);
        });
    }
    finally { }
}
run().catch(error => console.error(error));


app.get('/', (req, res) => {
    res.send('mobihub server is running')
})

app.listen(port, () => {
    console.log(`mobihub server running on ${port}`);
})
