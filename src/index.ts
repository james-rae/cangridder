import fs from 'fs';

/**
 * Char is 0-9
 */
const CHAR_NUM = 0;

/**
 * Char is .
 */
const CHAR_DECIMAL = 1;

/**
 * Char is anything else
 */
const CHAR_NORMIE = 2;

/**
 * How many numbers after the decimal to keep
 */
const MAX_DECIMAL = 4;

/**
 * Looking to find a number
 */
const MODE_HUNT = 0;

/**
 * Parsing start of a number (pre-decimal)
 */
const MODE_PREDOT = 1;

/**
 * Parsing a number, into the decimal
 */
const MODE_POSTDOT = 2;

async function parser(path: string) {
    /**
     * Sauce file
     */
    const inData = await fs.promises.readFile(path, 'utf8');

    /**
     * Current position crawling through test data
     */
    let readIdx = 0;

    /**
     * Data we are writing out.
     */
    let outData = '';

    /**
     * Marks if we are stil processing data
     */
    let done = false;

    /**
     * Current parse mode
     */
    let mode = MODE_HUNT;

    /**
     * How many decimal digits past the decimal point
     */
    let decCount = 0;

    /**
     * Allows us to do string concat in small blocks to avoid memory madness
     */
    let cookieBuffer = '';

    /**
     * Checks what a character is
     * @param {string} testChar a 1 character string
     * @returns constant for one of the four categories (top o file)
     */
    const charType = (testChar: string): number => {
        const charCode = testChar.charCodeAt(0);
        if (charCode > 47 && charCode < 58) {
            return CHAR_NUM;
        } else if (testChar === '.') {
            return CHAR_DECIMAL;
        } else {
            return CHAR_NORMIE;
        }
    };

    /**
     * Infinite loop insurance
     */
    let emergCounter = 0;

    while (!done) {
        // figure out what next char is.

        /**
         * Char we're inpsecting
         */
        const nextChar = inData.charAt(readIdx);

        /**
         * What kind of char it is (num, decimal, other)
         */
        const nextType = charType(nextChar);
        readIdx++;

        if (mode === MODE_HUNT) {
            // hunting for next potential number

            // always take the character
            cookieBuffer += nextChar;

            if (nextType === CHAR_NUM) {
                mode = MODE_PREDOT;
            }
        } else if (mode === MODE_PREDOT) {
            // looking for following scenarios:
            // a) another number, still in pre-decimal
            // b) decimal, shift to decimal mode
            // c) normie char. exit pre-decimal, wasn't a decimal number

            // always take the character
            cookieBuffer += nextChar;

            if (nextType === CHAR_DECIMAL) {
                mode = MODE_POSTDOT;
                decCount = 0;
            } else if (nextType !== CHAR_NUM) {
                mode = MODE_HUNT;
            }
        } else if (mode === MODE_POSTDOT) {
            // looking for following scenarios:
            // a) another number, still in post-decimal
            //    - if count is <= max, take it
            //    - if higher, discard it
            // b) anything else. kick back to hunt mode

            let write = true;

            if (nextType === CHAR_NUM) {
                decCount++;
                if (decCount > MAX_DECIMAL) {
                    write = false;
                }
            } else {
                mode = MODE_HUNT;
            }

            if (write) {
                cookieBuffer += nextChar;
            }
        }

        if (emergCounter > 9999999999) {
            console.warn('Hit the emergency counter kickout.');
            done = true;
        }
        emergCounter++;

        if (readIdx >= inData.length) {
            // EOF donethanks
            done = true;
        }

        // if we're done, or our buffer is getting big, write to final output string.
        if (cookieBuffer.length > 1000 || done) {
            outData = outData.concat(cookieBuffer);
            cookieBuffer = '';
        }
    }

    // write out stuff to file
    const outfileMain = path.slice(0, path.length - 5) + '.squash.json';

    await fs.promises.writeFile(outfileMain, outData, 'utf8');

    console.log('Done Thanks');
}

parser('./guts/columbia.txt');
