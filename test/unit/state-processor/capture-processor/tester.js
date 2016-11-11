'use strict';

const fs = require('fs-extra');
const Promise = require('bluebird');
const temp = require('lib/temp');
const Image = require('lib/image');
const NoRefImageError = require('lib/errors/no-ref-image-error');
const Tester = require('lib/state-processor/capture-processor/tester');

describe('state-processor/capture-processor/tester', () => {
    const sandbox = sinon.sandbox.create();

    afterEach(() => sandbox.restore());

    it('should have static factory creation method', () => {
        assert.instanceOf(Tester.create(), Tester);
    });

    describe('exec', () => {
        let capture;
        let tester;

        beforeEach(() => {
            sandbox.stub(temp, 'path').returns('tmp/path');
            sandbox.stub(Image, 'compare').returns(true);
            sandbox.stub(fs, 'accessAsync').returns(Promise.resolve());

            capture = {
                canHaveCaret: true,
                image: {
                    save: sandbox.stub().returns(Promise.resolve())
                }
            };

            tester = Tester.create('#diff');
        });

        it('should save image into temporary folder', () => {
            return tester.exec(capture, {})
                .then(() => {
                    assert.calledWith(capture.image.save, 'tmp/path');
                });
        });

        it('should reject with error if reference image does not exist', () => {
            fs.accessAsync.returns(Promise.reject());
            return assert.isRejected(tester.exec(capture, {}), NoRefImageError);
        });

        it('should compare images with given set of parameters', () => {
            const options = {
                refPath: 'some/ref/path',
                pixelRatio: 99,
                tolerance: 23,
                ignoreAntialiasing: true
            };

            return tester.exec(capture, options)
                .then(() => {
                    assert.calledWith(Image.compare, 'tmp/path', 'some/ref/path', {
                        ignoreCaret: true,
                        pixelRatio: 99,
                        tolerance: 23,
                        ignoreAntialiasing: true
                    });
                });
        });

        it('should return image comparison result', () => {
            return tester.exec(capture, {refPath: 'some/ref/path'})
                .then((result) => {
                    assert.deepEqual(result, {
                        currentPath: 'tmp/path',
                        referencePath: 'some/ref/path',
                        equal: true
                    });
                });
        });
    });
});
