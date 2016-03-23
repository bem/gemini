'use strict';

var BrowserAgent = require('../../../../src/runner/browser-runner/browser-agent'),
    BasicPool = require('../../../../src/browser-pool/basic-pool');

describe('runner/browser-runner/browser-agent', function() {
    var sandbox = sinon.sandbox.create(),
        browserPool;

    beforeEach(function() {
        browserPool = sinon.createStubInstance(BasicPool);
    });

    afterEach(function() {
        sandbox.restore();
    });

    it('should return browser associated with agent', function() {
        var browserAgent = BrowserAgent.create('browser', browserPool);

        browserAgent.getBrowser();

        assert.calledWith(browserPool.getBrowser, 'browser');
    });

    it('should free passed browser', function() {
        var browserAgent = BrowserAgent.create(undefined, browserPool),
            browser = sinon.spy().named('browser');

        browserAgent.freeBrowser(browser);

        assert.calledWith(browserPool.freeBrowser, browser);
    });

    it('should finalize browsers associated with agent', function() {
        var browserAgent = BrowserAgent.create('browser', browserPool);

        browserAgent.finalizeBrowsers();

        assert.calledWith(browserPool.finalizeBrowsers, 'browser');
    });
});
