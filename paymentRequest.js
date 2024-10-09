// File paymentRequest.js start

const { default: axios } = require('axios');
const { response } = require('express');
const { promisesParser } = require('./utils');
const paymentMethods = require('./paymentMethods');
const convinientStores = require('./convinientStores');
const PaymentMethodNotFoundException = require('./exceptions/paymentMethodNotFoundException');
const ConvenientStoreNotFoundException = require('./exceptions/convinientStoreNotFoundException');

require('dotenv').config(); // Load environment variables

/**
 * @typedef {Object} BankInfo
 * @property {string} bank - The bank code of the payment.
 * @property {string} account - The bank account of the payment.
 */

/**
 * @typedef {Object} PaymentInfo
 * @property {number} method - The payment method to use.
 * @property {string} [code] - The payment code of convinient store.
 * @property {BankInfo} [bank] - The bank info of the payment. 
 */

class PaymentRequest {
    /** @type {string} */
    purName;
    /** @type {string} */
    mobileNumber;
    /** @type {string} */
    email;
    /** @type {number | undefined} */
    convinientStore;
    /** @type {number} */
    paymentMethod;

    /** @param {import('./invoiceManager').PaymentRequestInvoiceArgument} invoice - The invoice object.*/
    constructor(invoice) {
        this.invoice = invoice;
        this.pur_name = invoice.name;
        this.mobileNumber = '--';
        this.email = invoice.email;
        this.convinientStore = invoice.convenience_store;
        this.paymentMethod = invoice.payment_method;
    }

    /**
     * Sets the payment method to use.
     * @returns {Promise<PaymentInfo>} The payment information.
     */
    async usePaymentMethod() {
        /** @type {PaymentInfo} */
        let paymentInfo = {};

        if (this.paymentMethod == paymentMethods.ConvenienceStoreCode) {
            paymentInfo.method = this.paymentMethod;
            paymentInfo.code = await this.generatePaymentCode(this.convinientStore);
            return paymentInfo;
        } 

        if (this.paymentMethod == paymentMethods.WebATM) {
            paymentInfo.method = this.paymentMethod;
            paymentInfo.bank = await this.generateBankInfo();
            return paymentInfo;
        }

        throw new PaymentMethodNotFoundException('Payment method not found');
    }

    /**
     * Generates the payment code from SmilePay API
     * @param {number | undefined} convinientStore - The convinient store code.
     * @returns {Promise<string>} The constructed payment code.
     */
    async generatePaymentCode(convinientStore) {
        if (convinientStore == null) throw new ConvenientStoreNotFoundException('Convinient store not found');

        const Dcvc = process.env.DCVC;
        const Rvg2c = process.env.RVG2C;
        const Verify_key = process.env.VERIFY_KEY;
        const Od_sob_prefix = process.env.OD_SOB_PREFIX;
        const Roturl = `${process.env.SELF_URL}/api/smilepay/pay`;
        const Roturl_status = "SmilepayPaid";
        const Od_sob = encodeURIComponent(`${Od_sob_prefix}${this.invoice.invoice_id}`);
        const Pay_zg = convinientStore;
        const Data_id = this.invoice.invoice_id;
        const Amount = this.invoice.total;
        const Pur_name = this.purName;
        const Mobile_number = this.mobileNumber;
        const Email = this.email;


        const url = `https://ssl.smse.com.tw/api/SPPayment.asp?Dcvc=${Dcvc}&Rvg2c=${Rvg2c}&Verify_key=${Verify_key}&Od_sob=${Od_sob}&Pay_zg=${Pay_zg}&Amount=${Amount}&Pur_name=${Pur_name}&Mobile_number=${Mobile_number}&Email=${Email}&Roturl=${Roturl}&Roturl_status=${Roturl_status}&Data_id=${Data_id}`;
        try {
            const response = await axios.get(url);
            const xmlData = response.data;
            let xmlReceived = await promisesParser(xmlData);
            let ibonNo = xmlReceived?.SmilePay?.IbonNo;
            let famiNo = xmlReceived?.SmilePay?.FamiNO;

            if (ibonNo) return ibonNo[0];
            if (famiNo) return famiNo[0];
            throw new Error('Failed to generate payment code');
        } catch (error) {
            console.error('Error generating payment code:', error);
            throw error;
        }
    }

    /**
     * Generates the bank info from SmilePay API
     * @returns {Promise<BankInfo>} The constructed bank info.
     */
    async generateBankInfo() {
        const Dcvc = process.env.DCVC;
        const Rvg2c = process.env.RVG2C;
        const Verify_key = process.env.VERIFY_KEY;
        const Od_sob_prefix = process.env.OD_SOB_PREFIX;
        const Roturl = `${process.env.SELF_URL}/api/smilepay/pay`;
        const Roturl_status = "SmilepayPaid";
        const Od_sob = encodeURIComponent(`${Od_sob_prefix}${this.invoice.invoice_id}`);
        const Pay_zg = 2;
        const Data_id = this.invoice.invoice_id;
        const Amount = this.invoice.total;
        const Pur_name = this.purName;
        const Mobile_number = this.mobileNumber;
        const Email = this.email;

        const url = `https://ssl.smse.com.tw/api/SPPayment.asp?Dcvc=${Dcvc}&Rvg2c=${Rvg2c}&Verify_key=${Verify_key}&Od_sob=${Od_sob}&Pay_zg=${Pay_zg}&Amount=${Amount}&Pur_name=${Pur_name}&Mobile_number=${Mobile_number}&Email=${Email}&Roturl=${Roturl}&Roturl_status=${Roturl_status}&Data_id=${Data_id}`;
        try {
            const response = await axios.get(url);
            const xmlData = response.data;
            let xmlReceived = await promisesParser(xmlData);

            /** @type {BankInfo} */
            let result = {};

            result.bank = xmlReceived?.SmilePay?.AtmBankNo;
            result.account = xmlReceived?.SmilePay?.AtmNo;

            if (!result.bank || !result.account) throw new Error('Failed to generate bank info');
            return result;
        } catch (error) {
            console.error('Error generating bank info:', error);
            throw error;
        }
    }
}

module.exports = PaymentRequest;
// File paymentRequest.js end