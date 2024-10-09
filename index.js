// File /index.js start

const express = require('express');
const path = require('path');
const convinientStores = require('./convinientStores');
const InvoiceManager = require('./invoiceManager');
const PaymentRoutes = require('./paymentsRoutes');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'invoices.json');
const invoiceManager = new InvoiceManager(DATA_FILE);
const paymentRoutes = new PaymentRoutes(app, invoiceManager, convinientStores);
app.listen(port, () => {
    console.log(`SmilePay Adapter API listening at http://localhost:${port}`);
});

// File /index.js end