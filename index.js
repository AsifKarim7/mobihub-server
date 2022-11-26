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
