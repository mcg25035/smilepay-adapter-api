// File paymentRequest.js start

const { default: axios } = require('axios');
const { response } = require('express');
var xml2jsParser = require('xml2js').parseString;

require('dotenv').config(); // Load environment variables

function promisesParser(string){
    return new Promise(function(resolve, reject){
        xml2jsParser(string, function(err, result) {
            if (err) return reject(err);
            return resolve(result);
        });
    });
}

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
     * @param {number} payZg - The convinient store code.
     * @returns {string} The constructed payment code.
     */
    async generatePaymentCode(payZg) {
        const Dcvc = this.dcvc;
        const Rvg2c = this.rvg2c;
        const Od_sob = `mctw${this.invoice.invoice_id}`;
        const Pay_zg = payZg;
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
            console.log(payZg)
            console.log(xmlData)

            let ibonNo, famiNo;

            

            let xmlReceived = await promisesParser(xmlData);
            ibonNo = xmlReceived?.SmilePay?.IbonNo[0];
            famiNo = xmlReceived?.SmilePay?.FamiNo[0];


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