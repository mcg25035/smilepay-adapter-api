// File paymentRequest.js start

const { default: axios } = require('axios');
const { response } = require('express');
var parseString = require('xml2js').parseString;

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
    convinientStore;
    /** @type {string} */
    roturl;
    /** @type {string} */
    roturl_status;

    /** @param {import('./invoiceManager').Invoice} invoice - The invoice object.*/
    constructor(invoice) {
        this.invoice = invoice;

        // Load required environment variables
        this.dcvc = process.env.DCVC;
        this.rvg2c = process.env.RVG2C;
        this.verify_key = process.env.VERIFY_KEY;

        // Static parameters
        this.pur_name = invoice.name;
        this.mobile_number = '--';
        this.email = invoice.email;
        this.convinientStore = invoice.convenience_store;
        this.roturl = 'http://0.tcp.jp.ngrok.io:14568/';
        this.roturl_status = 'testOK';
    }

    /**
     * Generates the payment code from SmilePay API
     * @returns {string} The constructed payment code.
     */
    async generatePaymentCode() {
        const Od_sob = `mctw${this.invoice.invoice_id}`;
        const Pay_zg = this.convinientStore;
        const Data_id = this.invoice.invoice_id;
        const Amount = this.invoice.total;

        const url = `https://ssl.smse.com.tw/api/SPPayment.asp?Dcvc=${encodeURIComponent(this.Dcvc)}&Rvg2c=${encodeURIComponent(this.Rvg2c)}&Verify_key=${encodeURIComponent(this.Verify_key)}&Od_sob=${encodeURIComponent(Od_sob)}&Pay_zg=${encodeURIComponent(Pay_zg)}&Amount=${encodeURIComponent(Amount)}&Pur_name=${encodeURIComponent(this.Pur_name)}&Mobile_number=${encodeURIComponent(this.Mobile_number)}&Email=${encodeURIComponent(this.Email)}&Roturl=${encodeURIComponent(this.Roturl)}&Roturl_status=${encodeURIComponent(this.Roturl_status)}&Data_id=${encodeURIComponent(Data_id)}`;
        try {
            const response = await axios.get(url);
            const xmlData = response.data;
            console.log(xmlData)

            let ibonNo, famiNo;

            

            parseString(xmlData, (err, result) => {
                if (err) {
                    throw new Error('Failed to parse XML');
                }
                ibonNo = result?.response?.IbonNo?.[0];
                famiNo = result?.response?.FamiNo?.[0];
            });

            if (ibonNo) return ibonNo;
            if (famiNo) return famiNo;
            throw new Error('Failed to generate payment code');

            
        } catch (error) {
            console.error('Error generating payment code:', error);
            throw error;
        }


        return url;
    }
}

module.exports = PaymentRequest;
// File paymentRequest.js end