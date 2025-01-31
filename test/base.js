/**
 * @file  fontmin base
 * @author junmer
 */

/* eslint-env node */

import { expect } from 'chai';
import path from 'path';
import bufferToVinyl from 'buffer-to-vinyl';
import Fontmin from '../index.js';

var dirname = path.dirname((new URL(import.meta.url)).pathname);
var fontPath = path.resolve(dirname, '../fonts');

describe('Fontmin util', function () {

    it('getFontFolder should be string', function () {
        expect(Fontmin.util.getFontFolder()).to.be.a('string');
    });

    it('getFonts should be array', function () {
        expect(Fontmin.util.getFonts()).to.be.a('array');
    });

});


describe('Fontmin base', function () {

    it('should run when no cb', function (done) {

        Fontmin()
            .src(fontPath + '/**.empty')
            .run()
            .on('end', function () {
                done();
            });
    });


    it('should not dest when src buffer', function (done) {

        Fontmin()
            .src(Buffer.from(''))
            .dest(fontPath + '/dest')
            .run(function (err, files, stream) {
                done();
            });
    });


    it('should run when src null', function (done) {

        var plugins = Fontmin.plugins.filter(function (plugin) {
            return plugin !== 'svgs2ttf';
        });

        var works = plugins.length;

        function usePlugin(plugin) {

            Fontmin()
                .src(fontPath + '/SentyBrush.ttf', {read: false})
                .use(Fontmin[plugin]())
                .run(function (err, files, stream) {

                    expect(files.length).equal(1);

                    if (0 === --works) {
                        done();
                    }

                });
        }

        plugins.forEach(usePlugin);

    });


    it('should dest one when clone false', function (done) {


        var plugins = ['ttf2eot', 'ttf2woff', 'ttf2svg'];
        var works = plugins.length;

        function usePlugin(plugin) {

            Fontmin()
                .src(fontPath + '/SentyBrush.ttf')
                .use(Fontmin.glyph({text: '1'}))
                .use(Fontmin[plugin]({clone: false}))
                .run(function (err, files, stream) {

                    expect(files.length).equal(1);

                    if (0 === --works) {
                        done();
                    }

                });
        }

        plugins.forEach(usePlugin);


    });

    it('should exclude files not font', function (done) {

        Fontmin()
            .src(fontPath + '/**.html', {read: false})
            .dest(fontPath + '/dest')
            .run(function (err, files, stream) {
                expect(files.length).equal(1);
                done();
            });
    });

    it('should throw `Streaming is not supported`', function (done) {

        var plugins = Fontmin.plugins;
        var works = plugins.length;

        function usePlugin(plugin) {

            Fontmin()
                .src(fontPath + '/SentyBrush.ttf', {buffer: false})
                .use(Fontmin[plugin]('test'))
                .run(function (err, files, stream) {

                    expect(err).to.match(/Streaming/);

                    if (0 === --works) {
                        done();
                    }

                });
        }

        plugins.forEach(usePlugin);

    });


});
