// File /invoiceManager.js start

const fs = require('fs');
const path = require('path');

/**
 * @typedef {Object} Invoice
 * @property {number} total - Total amount of the invoice
 * @property {object[]} products - List of products in the invoice
 * @property {string} invoice_id - Unique identifier for the invoice
 * @property {string} paymentLink - Payment link for the invoice
 * @property {string|null} convenience_store - Convenience store for payment
 * @property {string|null} store_set_time - Time when convenience store was set
 * @property {string} name - Name of the customer
 * @property {string} email - Email of the customer
 */

class InvoiceManager {
    /**
     * Creates an instance of InvoiceManager.
     * @param {string} dataFile - The path to the invoices data file.
     */
    constructor(dataFile) {
        this.dataFile = dataFile;
        /** @type {Object.<string, Invoice>} */
        this.invoiceMap = {};
        this.loadInvoices();
    }

    /**
     * Loads invoices from the data file.
     */
    loadInvoices() {
        if (fs.existsSync(this.dataFile)) {
            try {
                const data = fs.readFileSync(this.dataFile, 'utf8');
                this.invoiceMap = JSON.parse(data);
                console.log('Loaded existing invoices from file.');
            } catch (err) {
                console.error('Error reading invoices file:', err);
                this.invoiceMap = {};
            }
        } else {
            console.log('No existing invoices file found. Starting fresh.');
            this.invoiceMap = {};
        }
    }

    /**
     * Saves invoices to the data file.
     */
    saveInvoices() {
        try {
            fs.writeFileSync(this.dataFile, JSON.stringify(this.invoiceMap, null, 2), 'utf8');
            console.log('Invoices saved to file.');
        } catch (err) {
            console.error('Error writing invoices file:', err);
        }
    }

    /**
     * Retrieves an invoice by its ID.
     * @param {string} invoice_id - The ID of the invoice.
     * @returns {Invoice|null} The invoice if found, otherwise null.
     */
    getInvoice(invoice_id) {
        return this.invoiceMap[invoice_id] || null;
    }

    /**
     * Adds a new invoice.
     * @param {Invoice} invoice - The invoice to add.
     */
    addInvoice(invoice) {
        this.invoiceMap[invoice.invoice_id] = invoice;
        this.saveInvoices();
    }

    /**
     * Updates an existing invoice.
     * @param {string} invoice_id - The ID of the invoice to update.
     * @param {Partial<Invoice>} updates - The fields to update.
     */
    updateInvoice(invoice_id, updates) {
        if (this.invoiceMap[invoice_id]) {
            this.invoiceMap[invoice_id] = { ...this.invoiceMap[invoice_id], ...updates };
            this.saveInvoices();
        }
    }
}

module.exports = InvoiceManager;
// File /invoiceManager.js end