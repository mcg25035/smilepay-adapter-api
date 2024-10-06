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
        const Dcvc = this.dcvc;
        const Rvg2c = this.rvg2c;
        const Od_sob = `mctw${this.invoice.invoice_id}`;
        const Pay_zg = this.convinientStore;
        const Data_id = this.invoice.invoice_id;
        const Amount = this.invoice.total;
        const Pur_name = this.pur_name;
        const Mobile_number = this.mobile_number;
        const Email = this.email;
        const Roturl = this.roturl;
        const Roturl_status = this.roturl_status;
        const Verify_key = this.verify_key;

        const url = `https://ssl.smse.com.tw/api/SPPayment.asp?Dcvc=${Dcvc}&Rvg2c=${Rvg2c}&Verify_key=${Verify_key}&Od_sob=${Od_sob}&Pay_zg=${Pay_zg}&Amount=${Amount}&Pur_name=${Pur_name}&Mobile_number=${Mobile_number}&Email=${Email}&Roturl=${Roturl}&Roturl_status=${Roturl_status}&Data_id=${Data_id}`;
        try {
            const response = await axios.get(url);
            const xmlData = response.data;
            console.log(Pay_zg)
            console.log(xmlData)

            let ibonNo, famiNo;

            

            let xmlReceived = await parseString(xmlData);
            ibonNo = xmlReceived?.smilepay?.IbonNo;
            famiNo = xmlReceived?.smilepay?.FamiNo;


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