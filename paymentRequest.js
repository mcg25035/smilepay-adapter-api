// File paymentRequest.js start

require('dotenv').config(); // Load environment variables

class PaymentRequest {
    constructor(invoice) {
        this.invoice = invoice;

        // Load required environment variables
        this.Dcvc = process.env.DCVC;
        this.Rvg2c = process.env.RVG2C;
        this.Verify_key = process.env.VERIFY_KEY;

        // Static parameters
        this.Pur_name = '---';
        this.Mobile_number = '---';
        this.Email = '---';
        this.Roturl = 'http://0.tcp.jp.ngrok.io:14568/';
        this.Roturl_status = 'testOK';
    }

    /**
     * Generates the payment URL based on invoice data and environment variables.
     * @returns {string} The constructed payment URL.
     */
    generateUrl() {
        const Od_sob = `mctw${this.invoice.invoice_id}`;
        const Pay_zg = 0;
        const Data_id = this.invoice.invoice_id;
        const Amount = this.invoice.total;

        // Construct the URL with query parameters
        const url = `https://ssl.smse.com.tw/api/SPPayment.asp?Dcvc=${encodeURIComponent(this.Dcvc)}&Rvg2c=${encodeURIComponent(this.Rvg2c)}&Verify_key=${encodeURIComponent(this.Verify_key)}&Od_sob=${encodeURIComponent(Od_sob)}&Pay_zg=${encodeURIComponent(Pay_zg)}&Amount=${encodeURIComponent(Amount)}&Pur_name=${encodeURIComponent(this.Pur_name)}&Mobile_number=${encodeURIComponent(this.Mobile_number)}&Email=${encodeURIComponent(this.Email)}&Roturl=${encodeURIComponent(this.Roturl)}&Roturl_status=${encodeURIComponent(this.Roturl_status)}&Data_id=${encodeURIComponent(Data_id)}`;

        return url;
    }
}

module.exports = PaymentRequest;
// File paymentRequest.js end