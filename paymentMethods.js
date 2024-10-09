// File /paymentMethod.js start
/**
 * @typedef {Object} paymentMethods
 * @property {number} ConvinientStoreCode - 超商代碼繳費
 * @property {number} WebATM - 虛擬銀行帳號代收
 * @property {function(string): boolean} hasOwnProperty
 */

/** @type {paymentMethods} */
module.exports = {
    "ConvinientStoreCode": 1,
    "WebATM": 2
}
// File /paymentMethod.js end