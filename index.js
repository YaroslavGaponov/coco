/*
 * app: coco
 * author: Yaroslav Gaponov <yaroslav.gaponov@gmail.com> (c) 2018
*/

'use strict';

const { Writable }      = require('stream');
const { StringDecoder } = require('string_decoder');

class SaxParser extends Writable {

    constructor(options) {
        super(options);
        const state = this._writableState;
        this._decoder = new StringDecoder(state.defaultEncoding);
        this.data = '';
    }

    _parser() {

        const _elparser = (str) => {
            if (!(str || str.length)) {
                return;
            }
            const arr = str.split(' ').map(e => e.trim());
            if (!(arr || arr.length)) {
                return;
            }
            const element = {
                tag: arr.shift(),
                attributes: {}
            };
            for (let i = 0; i < arr.length; i++) {
                const pair = arr[i].split('=');
                if (pair.length === 2) {
                    const start = (pair[1].startsWith('\"') || pair[1].startsWith('\'')) ? 1 : 0;
                    const end = pair[1].length - ((pair[1].endsWith('\"') || pair[1].startsWith('\'')) ? 1 : 0);
                    element.attributes[pair[0]] = pair[1].substring(start, end);
                }
            }
            return element;
        };

        let index = 0;
        let str = this.data;
        for (;;) {

            if (str.startsWith('<!')) {
                const end = str.indexOf('>');
                if (end === -1) {
                    break;
                }
                index = end + 1;
            } else if (str.startsWith('</')) {
                const end = str.indexOf('>');
                if (end === -1) {
                    break;
                }
                const el = _elparser(str.substring(2, end));
                if (el) {
                    this.emit('SAX_endTag', el.tag, el.attributes);
                }
                index = end + 1;

            } else if (str.startsWith('<')) {
                const end = str.indexOf('>');
                if (end === -1) {
                    break;
                }
                const el = _elparser(str.substring(1, end));
                if (el) {
                    this.emit('SAX_startTag', el.tag, el.attributes);
                }
                index = end + 1;
            } else {
                const end = str.indexOf('<');
                if (end === -1) {
                    break;
                }
                const text = str.substring(0, end).replace(/\s+/g, '');
                if (text.length > 0) {
                    this.emit('SAX_text', str.substring(0, end));
                }
                index = end;
            }
            str = str.substring(index);
        }

        this.data = str;
    }
    _write(chunk, encoding, callback) {
        if (encoding === 'buffer') {
            chunk = this._decoder.write(chunk);
        }
        this.data += chunk;
        this._parser();
        callback();
    }
    _final(callback) {
        this.data += this._decoder.end();
        this._parser();
        callback();
    }
}

module.exports = SaxParser;
