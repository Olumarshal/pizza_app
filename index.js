const express = require('express');
const moment = require('moment');
const mongoose = require('mongoose');
require("dotenv").config();
const { connectToDB } = require("./db")

const orderRoute = require("./routes/order")

const orderModel = require('./models/orderModel');
const userModel = require('./models/userModel');

const { authenticate } = require("./authenticate");


const PORT = process.env.PORT;
const app = express()

app.use(express.json());

app.use("/order", orderRoute)


app.get('/', (req, res) => {
    authenticate(req, res, ["admin", "user"])
        .then(() => {
            return res.json({ status: true });
        }).catch((err) => {
            res.writeHead(400)
            res.send(JSON.stringify({
                message: err
            }))
        })
    
})


app.post('/order', async (req, res) => {
    const body = req.body;

    const total_price = body.items.reduce((prev, curr) => {
        prev += curr.price
        return prev
    }, 0);

    const order = await orderModel.create({ 
        items: body.items,
        created_at: moment().toDate(),
        total_price
    })
    
    return res.json({ status: true, order })
})

app.get('/order/:orderId', async (req, res) => {
    const { orderId } = req.params;
    const order = await orderModel.findById(orderId)

    if (!order) {
        return res.status(404).json({ status: false, order: null })
    }

    return res.json({ status: true, order })
})

app.get('/orders', async (req, res) => {
    const orders = await orderModel.find()

    return res.json({ status: true, orders })
})

app.patch('/order/:id', async (req, res) => {
    const { id } = req.params;
    const { state } = req.body;

    const order = await orderModel.findById(id)

    if (!order) {
        return res.status(404).json({ status: false, order: null })
    }

    if (state < order.state) {
        return res.status(422).json({ status: false, order: null, message: 'Invalid operation' })
    }

    order.state = state;

    await order.save()

    return res.json({ status: true, order })
})

app.delete('/order/:id', async (req, res) => {
    const { id } = req.params;

    const order = await orderModel.deleteOne({ _id: id})

    return res.json({ status: true, order })
})

connectToDB()
// mongoose.connect('mongodb://localhost:27017')

// mongoose.connection.on("connected", () => {
// 	console.log("Connected to MongoDB Successfully");
// });

// mongoose.connection.on("error", (err) => {
// 	console.log("An error occurred while connecting to MongoDB");
// 	console.log(err);
// });

app.listen(PORT, () => {
    console.log('Listening on port, ', PORT)
})