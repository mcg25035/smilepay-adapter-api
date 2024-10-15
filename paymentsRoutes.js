// File paymentsRoutes.js start

const cors = require('cors');
const bodyParser = require('body-parser');
const PaymentRequest = require('./paymentRequest');
const { getMidSmilePay } = require('./utils');
const { default: axios } = require('axios');
const InvoiceManager = require('./invoiceManager');
require('dotenv').config();

/** @typedef {import('express').Application} ExpressApp */

class PaymentRoutes {
    /** @type {ExpressApp} */
    app;
    /** @type {import('./invoiceManager')} */
    invoiceManager;
    /** @type {import('./paymentMethods').paymentMethods} */
    paymentMethods;
    /**
     * Creates an instance of PaymentRoutes.
     * @param {ExpressApp} app - The Express app instance.
     * @param {InvoiceManager} invoiceManager - The InvoiceManager instance.
     * @param {import('./paymentMethods')} paymentMethods - The object containing allowed payment methods.
     */
    constructor(app, invoiceManager, paymentMethods) {
        this.app = app;
        this.invoiceManager = invoiceManager;
        this.paymentMethods = paymentMethods;
        this.setupRoutes();
    }

    setupRoutes() {
        const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';

        const corsOptions = {
            origin: allowedOrigin,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            credentials: true,
        };

    
        this.app.use('/pay', cors(corsOptions));
        this.app.use('/api/smilepay/pay', bodyParser.urlencoded({ extended: true }));

        /**
         * @route POST /pay
         * @desc Creates a new payment link for an invoice.
         * @access Public
         */
        this.app.post('/pay', (req, res) => {
            /** @type {InvoiceManager.Invoice} */
            const requestBody = req.body;
            let { total, products, invoice_id, name, email } = requestBody;

            products.push({
                "price" : "選擇後計算",
                "quantity" : 1,
                "name" : "SmilePay手續費(超商35元 / ATM13元)"
            });

            if (!invoice_id) {
                console.log('Received payment data without invoice_id:', req.body);
                return res.status(400).json({ error: 'Missing invoice_id' });
            }

            const existingInvoice = this.invoiceManager.getInvoice(invoice_id);
            if (existingInvoice) {
                console.log(`Invoice ID ${invoice_id} already exists. Returning existing paymentLink.`);
                return res.status(200).json({ paymentLink: existingInvoice.paymentLink });
            }

            const paymentLink = `${process.env.FRONTEND_URL}/${invoice_id}`;

            products

            const newInvoice = {
                total,
                products,
                invoice_id,
                name,
                email,
                paymentLink,
                payment_method: null,
                payment_method_set_time: null
            };

            this.invoiceManager.addInvoice(newInvoice);
            console.log(`Generated paymentLink for invoice_id ${invoice_id}: ${paymentLink}`);
            return res.status(200).json({ paymentLink });
        });

        /**
         * @route PUT /pay
         * @desc Updates the payment method for an invoice.
         * @access Public
         */
        this.app.put('/pay', async (req, res) => {
            const { invoice_id, payment_method } = req.body;

            if (!invoice_id || !payment_method) {
                console.log('Received PUT /pay request with missing fields:', req.body);
                return res.status(400).json({ error: 'Missing invoice_id or payment_method' });
            }

            if (!this.paymentMethods.hasOwnProperty(payment_method)) {
                console.log(`Invalid payment_method: ${payment_method}`);
                return res.status(400).json({ error: 'Invalid payment_method' });
            }

            /** @type {import('./invoiceManager').Invoice} */
            let invoice = this.invoiceManager.getInvoice(invoice_id);
            if (!invoice) {
                console.log(`Invoice ID ${invoice_id} does not exist.`);
                return res.status(404).json({ error: 'Invoice not found' });
            }

            if (invoice.payment_method) {
                console.log(`Invoice ID ${invoice_id} already has a payment_method set.`);
                return res.status(403).json({ error: 'payment_method has already been set and cannot be changed' });
            }

            invoice.products.forEach(product => {
                /** @type {string} */
                let productName = product.name;
                if (!productName.includes("SmilePay手續費")) return;
                product.price = payment_method == 2 ? 13 : 35;
                invoice.total += product.price;
                product.name = "SmilePay手續費";
            });

            let code;
            try{
                code = await (new PaymentRequest(invoice)).generatePaymentCode(this.paymentMethods[payment_method]);
            }
            catch(err){
                console.error('Error generating payment code:', err);
                return res.status(500).json({ error: 'Error generating payment code' });
            }

            let updates = {
                payment_method: payment_method,
                payment_method_set_time: new Date().toISOString(),
                products: invoice.products,
                code
            };
            console.log(updates);
            this.invoiceManager.updateInvoice(invoice_id, updates);

            console.log(`Updated payment_method for invoice_id ${invoice_id} to ${payment_method}.`);
            return res.status(200).json({ status: 'payment_method updated successfully' });
        });


        /**
         * @route GET /pay/:invoice_id
         * @desc Retrieves the invoice data for a given invoice_id.
         * @access Public
         */
        this.app.get('/pay/:invoice_id', (req, res) => {
            const { invoice_id } = req.params;

            if (!invoice_id) {
                console.log('Received GET /pay request without invoice_id');
                return res.status(400).json({ error: 'Missing invoice_id' });
            }

            const invoice = this.invoiceManager.getInvoice(invoice_id);
            if (!invoice) {
                console.log(`Invoice ID ${invoice_id} does not exist.`);
                return res.status(404).json({ error: 'Invoice not found' });
            }

            delete invoice.name;
            delete invoice.email;

            console.log(`Retrieved data for invoice_id ${invoice_id}:`, invoice);
            return res.status(200).json(invoice);
        });

        this.app.post('/api/smilepay/pay', async (req, res)=>{
            const dataId = req.body.Data_id;
            const smseid = req.body.Smseid;
            const amount = req.body.Purchamt;
            const merchantParam = process.env.MERCHANT_PARAM;

            const midSmilePayCorrect = getMidSmilePay(merchantParam, amount, smseid);
            const midSmilePayReceived = req.body.Mid_smilepay;

            if (!midSmilePayReceived) {
                console.log('Mid_smilepay verification failed. Missing Mid_smilepay in request body');
                return res.status(400).send('Mid_smilepay verification failed');
            }

            if (midSmilePayCorrect != midSmilePayReceived) {
                console.log('Mid_smilepay verification failed. Received:', midSmilePayReceived, 'Expected:', midSmilePayCorrect);
                return res.status(400).send('Mid_smilepay verification failed');
            }

            try{
                this.invoiceManager.deleteInvoice(dataId);
            }
            catch(err){
                console.error(`Invoice ${dataId} not found.`);
                return res.status(500).send(`Failed to delete invoice, invoice ${dataId} not found`);
            }
            
            
            try {
                await axios.post(process.env.PAYMENTER_WEBHOOK_URL, {}, {
                    headers: {
                        'x-api-key': process.env.PAYMENTER_WEBHOOK_API_KEY,
                        'x-order-id': dataId
                    }
                });
            } catch (error) {
                console.error('Error sending webhook notification:', error);
                res.status(500).send('Invoice deleted but failed to send webhook notification');
                return;
            }

            console.log(`Invoice ID ${dataId} deleted successfully.`);
            return res.status(200).send("<Roturlstatus>SmilepayPaid</Roturlstatus>");
        })
    }
}

module.exports = PaymentRoutes;
// File paymentsRoutes.js end
