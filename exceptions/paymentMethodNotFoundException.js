class PaymentMethodNotFoundException extends Error {
    constructor(message) {
        super(message);
        this.name = 'PaymentMethodNotFoundException';
    }
}

module.exports = PaymentMethodNotFoundException;