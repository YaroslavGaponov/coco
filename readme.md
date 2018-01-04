coco
================

## Oweview
Very simple SAX parser

#### Api
```
const parser = new SaxParser();

// event for start tags
parser.on('SAX_startTag', (tag, attrs) => {
    console.log(`start: ${tag}\nattributes: ${JSON.stringify(attrs)}`);
});

// event for end tags
parser.on('SAX_endTag', (tag, attrs) => {
    console.log(`end: ${tag}\nattributes: ${JSON.stringify(attrs)}`);
});

// event for text
parser.on('SAX_text', text => {
    console.log(`text: ${text}`);
});

// parse
parser.write('<html><header>Hello from html page</header><body><a>This is body</a></body></html>');
```

#### Example
```
const url   = require('url');
const http  = require('http');
const https = require('https');

const SaxParser = require('.');

https.globalAgent.maxSockets = 100;
http.globalAgent.maxSockets  = 100;

const links = new Set();

function crawler(link) {
    console.log(link);
    links.add(link);
    (link.startsWith('https') ? https : http)
        .get(link, res => {
            if (res.statusCode !== 200) {
                res.resume();
                return;
            }
            const parser = new SaxParser();
            parser.on('SAX_startTag', (tag, attrs) => {
                if (tag === 'a' && attrs.href) {
                    const l = url.resolve(link, attrs.href);
                    if (!links.has(l) && l.startsWith('http')) {
                        crawler(l);
                    }                    
                }
            });
            res.pipe(parser);
        });
}

crawler('https://nodejs.org/en/')
```

