'use strict';

const Promise = require('bluebird');

const ActionsBuilder = require('lib/tests-api/actions-builder');
const util = require('../../util');

describe('tests-api/actions-builder', () => {
    const sandbox = sinon.sandbox.create();
    const browser = util.makeBrowser();

    const mkActionsBuilder = (actions) => new ActionsBuilder(actions || []);

    const mkAction = (actionName, browser, postActions) => () => {
        const actions = [];
        const actionsBuilder = mkActionsBuilder(actions);

        actionsBuilder[actionName].apply(actionsBuilder, arguments);
        return actions[0](browser, postActions);
    };

    afterEach(() => sandbox.restore());

    describe('changeOrientation', () => {
        beforeEach(() => {
            sandbox.stub(browser, 'getOrientation').returns(Promise.resolve());
            sandbox.stub(browser, 'setOrientation').returns(Promise.resolve());
        });

        it('should throw in case of passed arguments', () => {
            const fn = () => mkActionsBuilder().changeOrientation('awesome argument');

            assert.throws(fn, TypeError, /\.changeOrientation\(\) does not accept any arguments/);
        });

        it('should return ActionsBuilder instance', () => {
            assert.instanceOf(mkActionsBuilder().changeOrientation(), ActionsBuilder);
        });

        it('should change orientation from PORTRAIT to LANDSCAPE', () => {
            browser.getOrientation.returns(Promise.resolve('PORTRAIT'));
            const changeOrientation = mkAction('changeOrientation', browser);

            return changeOrientation()
                .then(() => assert.calledWith(browser.setOrientation, 'LANDSCAPE'));
        });

        it('should change orientation from LANDSCAPE to PORTRAIT', () => {
            browser.getOrientation.returns(Promise.resolve('LANDSCAPE'));
            const changeOrientation = mkAction('changeOrientation', browser);
            return changeOrientation()
                .then(() => assert.calledWith(browser.setOrientation, 'PORTRAIT'));
        });

        it('should restore orientation in post actions', () => {
            const postActions = sinon.createStubInstance(ActionsBuilder);
            const changeOrientation = mkAction('changeOrientation', browser, postActions);

            return changeOrientation()
                .then(() => assert.called(postActions.changeOrientation));
        });

        it('should be rejected if getting of orientation fails', () => {
            browser.getOrientation.returns(Promise.reject('awesome error'));
            const changeOrientation = mkAction('changeOrientation', browser);
            return assert.isRejected(changeOrientation(), /awesome error/);
        });

        it('should be rejected if setting of orientation fails', () => {
            browser.setOrientation.returns(Promise.reject('awesome error'));
            const changeOrientation = mkAction('changeOrientation', browser);
            return assert.isRejected(changeOrientation(), /awesome error/);
        });
    });

    describe('mouse actions', () => {
        beforeEach(() => {
            sandbox.stub(browser, 'moveTo').returns(Promise.resolve());
            sandbox.stub(browser, 'findElement').returns(Promise.resolve({}));
        });

        describe('click', () => {
            beforeEach(() => {
                sandbox.stub(browser, 'click').returns(Promise.resolve());
            });

            it('should use left button if not specified', () => {
                const click = mkAction('click', browser);

                return click('.some-selector')
                    .then(() => assert.calledWith(browser.click, 0));
            });

            it('should use passed button', () => {
                const click = mkAction('click', browser);

                return click('.some-selector', 1)
                    .then(() => assert.calledWith(browser.click, 1));
            });

            it('should throw on bad button (not 0, 1 or 2)', () => {
                const click = mkAction('click', browser);

                assert.throws(() => click('.some-selector', 3), /Mouse button should be/);
            });
        });

        describe('doubleClick', () => {
            beforeEach(() => {
                sandbox.stub(browser, 'doubleClick').returns(Promise.resolve());
            });

            it('should use left button if not specified', () => {
                const doubleClick = mkAction('doubleClick', browser);

                return doubleClick('.some-selector')
                    .then(() => assert.calledWith(browser.doubleClick, '.some-selector', 0));
            });

            it('should use passed button', () => {
                const doubleClick = mkAction('doubleClick', browser);

                return doubleClick('.some-selector', 1)
                    .then(() => assert.calledWith(browser.doubleClick, '.some-selector', 1));
            });

            it('should throw on bad button (not 0, 1 or 2)', () => {
                const doubleClick = mkAction('doubleClick', browser);

                assert.throws(() => doubleClick('.some-selector', 3), /Mouse button should be/);
            });
        });

        describe('mouseDown', () => {
            beforeEach(() => {
                sandbox.stub(browser, 'buttonDown').returns(Promise.resolve());
            });

            it('should use left button if not specified', () => {
                const mouseDown = mkAction('mouseDown', browser);

                return mouseDown('.some-selector')
                    .then(() => assert.calledWith(browser.buttonDown, 0));
            });

            it('should use passed button', () => {
                const mouseDown = mkAction('mouseDown', browser);

                return mouseDown('.some-selector', 1)
                    .then(() => assert.calledWith(browser.buttonDown, 1));
            });

            it('should throw on bad button (not 0, 1 or 2)', () => {
                const mouseDown = mkAction('mouseDown', browser);

                assert.throws(() => mouseDown('.some-selector', 3), /Mouse button should be/);
            });
        });

        describe('mouseUp', () => {
            beforeEach(() => {
                sandbox.stub(browser, 'buttonUp').returns(Promise.resolve());
            });

            it('should use left button if not specified', () => {
                const mouseUp = mkAction('mouseUp', browser);

                return mouseUp('.some-selector')
                    .then(() => assert.calledWith(browser.buttonUp, 0));
            });

            it('should use passed button', () => {
                const mouseUp = mkAction('mouseUp', browser);

                return mouseUp('.some-selector', 1)
                    .then(() => assert.calledWith(browser.buttonUp, 1));
            });

            it('should throw on bad button (not 0, 1 or 2)', () => {
                const mouseUp = mkAction('mouseUp', browser);

                assert.throws(() => mouseUp('.some-selector', 3), /Mouse button should be/);
            });
        });
    });
});
