#!/usr/bin/env node

/**
 * @file cli
 * @author junmer
 */

/* eslint-env node */

'use strict';

import fs from 'fs';
import meow from 'meow';
import path from 'path';
import stdin from 'get-stdin';
import Fontmin from './index.js';
import _ from 'lodash';

var cli = meow([
    'Usage',
    '  $ fontmin <file> [<output>]',
    '  $ fontmin <directory> [<output>]',
    '  $ fontmin <file> > <output>',
    '  $ cat <file> | fontmin > <output>',
    '',
    'Example',
    '  $ fontmin fonts/* build',
    '  $ fontmin fonts build',
    '  $ fontmin foo.ttf > foo-optimized.ttf',
    '  $ cat foo.ttf | fontmin > foo-optimized.ttf',
    '',
    'Options',
    '  -t, --text                          require glyphs by text',
    '  -b, --basic-text                    require glyphs with base chars',
    '  -d, --deflate-woff                  deflate woff',
    '  --font-family                       font-family for @font-face CSS',
    '  --css-glyph                         generate class for each glyf. default = false',
    '  -T, --show-time                     show time fontmin cost'
].join('\n'), {
    importMeta: import.meta,
    'boolean': [
        'basic-text',
        'show-time',
        'deflate-woff',
        'css-glyph',
        'version'
    ],
    'string': [
        'text',
        'font-family'
    ],
    'alias': {
        t: 'text',
        b: 'basic-text',
        d: 'deflate-woff',
        T: 'show-time',
        h: 'help',
        v: 'version'
    }
});

// version
if (cli.flags.version) {
    console.log(require('./package.json').version);
    process.exit(0);
}

function isFile(path) {
    if (/^[^\s]+\.\w*$/.test(path)) {
        return true;
    }

    try {
        return fs.statSync(path).isFile();
    }
    catch (err) {
        return false;
    }
}


function run(src, dest) {

    cli.flags.showTime && console.time('fontmin use');

    var pluginOpts = _.extend(
        {},
        cli.flags,
        {
            deflate: cli.flags.deflateWoff,
            glyph: cli.flags.cssGlyph
        }
    );

    var fontmin = new Fontmin()
        .src(src)
        .use(Fontmin.otf2ttf(pluginOpts))
        .use(Fontmin.glyph(pluginOpts))
        .use(Fontmin.ttf2eot(pluginOpts))
        .use(Fontmin.ttf2svg(pluginOpts))
        .use(Fontmin.ttf2woff(pluginOpts))
        .use(Fontmin.ttf2woff2(pluginOpts))
        .use(Fontmin.css(pluginOpts));

    if (dest) {
        fontmin.dest(dest);
    }

    fontmin.run(function (err, files) {
        if (err) {
            console.error(err.stack || err);
            process.exit(1);
        }

        cli.flags.showTime && console.timeEnd('fontmin use');
    });
}

var src = cli.input;
var dest;

if (!cli.input.length) {
    console.error([
        'Provide at least one file to optimize',
        '',
        'Example',
        '  fontmin font/* build',
        '  fontmin foo.ttf > foo-optimized.ttf',
        '  cat foo.ttf | fontmin > foo-optimized.ttf',
        '',
        'See `fontmin --help` for more information.'
    ].join('\n'));

    process.exit(1);
}

if (src.length > 1 && !isFile(src[src.length - 1])) {
    dest = src[src.length - 1];
    src.pop();
}

src = src.map(function (s) {
    if (!isFile(s) && fs.existsSync(s)) {
        return path.join(s, '**/*');
    }

    return s;
});

run(src, dest);
