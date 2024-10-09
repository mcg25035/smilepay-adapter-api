class ConvenientStoreNotFoundException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ConvenientStoreNotFoundException';
    }
}

module.exports = ConvenientStoreNotFoundException;