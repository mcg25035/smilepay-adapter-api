const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
const DATA_FILE = path.join(__dirname, 'invoices.json');

let invoiceMap = {};

function loadInvoices(){
    if (fs.existsSync(DATA_FILE)) {
        try {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            invoiceMap = JSON.parse(data);
            console.log('Loaded existing invoices from file.');
        } catch (err) {
            console.error('Error reading invoices file:', err);
            invoiceMap = {};
        }
        return;
    } 

    console.log('No existing invoices file found. Starting fresh.');
    invoiceMap = {};
};

function saveInvoices() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(invoiceMap, null, 2), 'utf8');
        console.log('Invoices saved to file.');
    } catch (err) {
        console.error('Error writing invoices file:', err);
    }
};

loadInvoices();

app.get('/pay', (req, res) => {
    const payload = req.body;
    const { total, products, invoice_id } = payload;

    if (!invoice_id) {
        console.log('Received payment data without invoice_id:', payload);
        return res.status(400).json({ error: 'Missing invoice_id' });
    }

    if (invoiceMap[invoice_id]) {
        console.log(`Invoice ID ${invoice_id} already exists. Returning existing paymentLink.`);
        return res.status(200).json({ paymentLink: invoiceMap[invoice_id].paymentLink });
    }

    const paymentLink = `https://www.youtube.com/watch?v=5mRbdtrKFy4&t=37s`;

    invoiceMap[invoice_id] = {
        total,
        products,
        invoice_id,
        paymentLink
    };

    saveInvoices();

    console.log(`Generated paymentLink for invoice_id ${invoice_id}: ${paymentLink}`);
    res.status(200).json({ paymentLink });
});

app.listen(port, () => {
    console.log(`SmilePay Adapter API listening at http://localhost:${port}`);
});
