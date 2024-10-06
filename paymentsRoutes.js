// File paymentsRoutes.js start

const cors = require('cors');
const PaymentRequest = require('./paymentRequest');
require('dotenv').config();

class PaymentRoutes {
    /** @type {express.Application} */
    app;
    /** @type {import('./invoiceManager')} */
    invoiceManager;
    /** @type {import('./convinientStores').convinientStores} */
    convinientStores;
    /**
     * Creates an instance of PaymentRoutes.
     * @param {express.Application} app - The Express app instance.
     * @param {InvoiceManager} invoiceManager - The InvoiceManager instance.
     * @param {import('./convinientStores')} convinientStores - The object containing allowed convenience stores.
     */
    constructor(app, invoiceManager, convinientStores) {
        this.app = app;
        this.invoiceManager = invoiceManager;
        this.convinientStores = convinientStores;
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

        /**
         * @route POST /pay
         * @desc Creates a new payment link for an invoice.
         * @access Public
         */
        this.app.post('/pay', (req, res) => {
            const { total, products, invoice_id, name, email } = req.body;

            if (!invoice_id) {
                console.log('Received payment data without invoice_id:', req.body);
                return res.status(400).json({ error: 'Missing invoice_id' });
            }

            const existingInvoice = this.invoiceManager.getInvoice(invoice_id);
            if (existingInvoice) {
                console.log(`Invoice ID ${invoice_id} already exists. Returning existing paymentLink.`);
                return res.status(200).json({ paymentLink: existingInvoice.paymentLink });
            }

            const paymentLink = `https://www.youtube.com/watch?v=5mRbdtrKFy4&t=37s`;

            const newInvoice = {
                total,
                products,
                invoice_id,
                name,
                email,
                paymentLink,
                convenience_store: null,
                store_set_time: null
            };

            this.invoiceManager.addInvoice(newInvoice);
            console.log(`Generated paymentLink for invoice_id ${invoice_id}: ${paymentLink}`);
            return res.status(200).json({ paymentLink });
        });

        /**
         * @route PUT /pay
         * @desc Updates the convenience store for an invoice.
         * @access Public
         */
        this.app.put('/pay', (req, res) => {
            const { invoice_id, convenience_store } = req.body;

            if (!invoice_id || !convenience_store) {
                console.log('Received PUT /pay request with missing fields:', req.body);
                return res.status(400).json({ error: 'Missing invoice_id or convenience_store' });
            }

            if (!this.convinientStores.hasOwnProperty(convenience_store)) {
                console.log(`Invalid convenience_store: ${convenience_store}`);
                return res.status(400).json({ error: 'Invalid convenience_store' });
            }

            /** @type {import('./invoiceManager').Invoice} */
            const invoice = this.invoiceManager.getInvoice(invoice_id);
            if (!invoice) {
                console.log(`Invoice ID ${invoice_id} does not exist.`);
                return res.status(404).json({ error: 'Invoice not found' });
            }

            if (invoice.convenience_store) {
                console.log(`Invoice ID ${invoice_id} already has a convenience_store set.`);
                return res.status(403).json({ error: 'Convenience_store has already been set and cannot be changed' });
            }

            const code = await (new PaymentRequest(invoice)).generatePaymentCode();

            const updates = {
                convenience_store: this.convinientStores[convenience_store],
                store_set_time: new Date().toISOString(),
                code
            };

            this.invoiceManager.updateInvoice(invoice_id, updates);

            console.log(`Updated convenience_store for invoice_id ${invoice_id} to ${convenience_store}.`);
            return res.status(200).json({ status: 'convenience_store updated successfully' });
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
    }
}

module.exports = PaymentRoutes;
// File paymentsRoutes.js end
