// File paymentRequest.js start

const { default: axios } = require('axios');
const { response } = require('express');
const { promisesParser } = require('./utils');

require('dotenv').config(); // Load environment variables

class PaymentRequest {
    /** @type {string} */
    dcvc;
    /** @type {string} */
    rvg2c;
    /** @type {string} */
    verify_key;
    /** @type {string} */
    pur_name;
    /** @type {string} */
    mobile_number;
    /** @type {string} */
    email;
    /** @type {number} */
    paymentMethod;
    /** @type {string} */
    roturl;
    /** @type {string} */
    roturl_status;

    /** @param {import('./invoiceManager').Invoice} invoice - The invoice object.*/
    constructor(invoice) {
        this.invoice = invoice;
        // Static parameters
        this.pur_name = invoice.name;
        this.mobile_number = '--';
        this.email = invoice.email;
        this.paymentMethod = invoice.payment_method;
    }

    /**
     * Generates the payment code from SmilePay API
     * @param {number} payZg - The payment method code.
     * @returns {string} The constructed payment code.
     */
    async generatePaymentCode(payZg) {
        const Dcvc = process.env.DCVC;
        const Rvg2c = process.env.RVG2C;
        const Verify_key = process.env.VERIFY_KEY;
        const Od_sob_prefix = process.env.OD_SOB_PREFIX;
        const Roturl = `${process.env.SELF_URL}/api/smilepay/pay`;
        const Roturl_status = "SmilepayPaid";
        const Od_sob = encodeURIComponent(`${Od_sob_prefix}${this.invoice.invoice_id}`);
        const Pay_zg = payZg;
        const Data_id = this.invoice.invoice_id;
        const Amount = this.invoice.total;
        const Pur_name = this.pur_name;
        const Mobile_number = this.mobile_number;
        const Email = this.email;

        const url = `https://ssl.smse.com.tw/api/SPPayment.asp?Dcvc=${Dcvc}&Rvg2c=${Rvg2c}&Verify_key=${Verify_key}&Od_sob=${Od_sob}&Pay_zg=${Pay_zg}&Amount=${Amount}&Pur_name=${Pur_name}&Mobile_number=${Mobile_number}&Email=${Email}&Roturl=${Roturl}&Roturl_status=${Roturl_status}&Data_id=${Data_id}`;
        try {
            const response = await axios.get(url);
            const xmlData = response.data;
            let xmlReceived = await promisesParser(xmlData);
            let ibonNo = xmlReceived?.SmilePay?.IbonNo;
            let famiNo = xmlReceived?.SmilePay?.FamiNO;
            let atmBankNo = xmlReceived?.SmilePay?.AtmBankNo;
            let atmAccountNo = xmlReceived?.SmilePay?.AtmNo;

            if (ibonNo) return ibonNo[0];
            if (famiNo) return famiNo[0];
            if (atmBankNo && atmAccountNo) return `${atmBankNo[0]}-${atmAccountNo[0]}`;
            throw new Error('Failed to generate payment code');
        } catch (error) {
            console.error('Error generating payment code:', error);
            throw error;
        }
    }
}

module.exports = PaymentRequest;
// File paymentRequest.js end