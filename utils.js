var xml2jsParser = require('xml2js').parseString;

/**
 * @param {string} xmlStrign 
 * @returns {object}
 */
function promisesParser(xmlStrign){
    return new Promise(function(resolve, reject){
        xml2jsParser(xmlStrign, function(err, result) {
            if (err) return reject(err);
            return resolve(result);
        });
    });
}

/**
 * Calculates the SmilePay verification code (Mid_smilepay)
 * @param {string|number} merchantParam - Merchant verification parameter (four digits, padded with leading zeros if less than four digits)
 * @param {string|number} amount - Collection amount (eight digits, padded with leading zeros if less than eight digits)
 * @param {string} smseid - Smseid parameter (last four characters, non-numeric characters are replaced with '9')
 * @returns {number} Mid_smilepay verification code
 */
function getMidSmilePay(merchantParam, amount, smseid) {
    // Convert merchant verification parameter to string, pad with zeros to ensure four digits, and take the last four digits
    let a = String(merchantParam).padStart(4, '0').slice(-4);

    // Convert collection amount to string, pad with zeros to ensure eight digits, and take the last eight digits
    let b = String(amount).padStart(8, '0').slice(-8);

    // Process the Smseid parameter: take the last four characters, replace non-numeric characters with '9'
    let smseidStr = String(smseid);
    let c_raw = smseidStr.slice(-4);
    let c = '';
    for (let char of c_raw) {
        if (/\d/.test(char)) {
            c += char;
        } else {
            c += '9';
        }
    }

    // Concatenate A, B, and C to form D
    let d = a + b + c;

    // Calculate E: Sum of digits in even positions (1-based indexing) multiplied by 3
    let e_sum = 0;
    for (let i = 1; i < d.length; i += 2) { // Even positions: indices 1, 3, 5, ...
        e_sum += parseInt(d.charAt(i), 10);
    }
    let e = e_sum * 3;

    // Calculate F: Sum of digits in odd positions (1-based indexing) multiplied by 9
    let f_sum = 0;
    for (let i = 0; i < d.length; i += 2) { // Odd positions: indices 0, 2, 4, ...
        f_sum += parseInt(d.charAt(i), 10);
    }
    let f = f_sum * 9;

    // Calculate the final Mid_smilepay verification code by adding E and F
    let midSmilePay = e + f;

    return midSmilePay;
}


module.exports = {
    promisesParser,
    getMidSmilePay
}