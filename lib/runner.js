'use strict';
var EventEmitter = require('events').EventEmitter,

    q = require('q'),
    inherit = require('inherit'),
    promiseUtils = require('./promise-util'),
    GeminiError = require('./errors/gemini-error'),
    StateError = require('./errors/state-error'),

    BrowserLauncher = require('./browser/launcher'),
    CaptureSession = require('../lib/capture-session'),
    Coverage = require('./coverage'),

    exec = q.denodeify(require('child_process').exec);

module.exports = inherit(EventEmitter, {

    __constructor: function(config, browserLauncher) {
        this.config = config;
        this._cancelled = false;
        this.browserLauncher = browserLauncher || new BrowserLauncher(config);
        this.coverage = new Coverage(config);
    },

    run: function(rootSuite) {
        var _this = this;
        return this._checkGM()
            .then(function() {
                _this.emit('begin', {
                    config: _this.config,
                    totalStates: rootSuite.deepStatesCount,
                    browserIds: Object.keys(_this.config.browsers)
                });
                return q(_this._prepare());
            })
            .then(function() {
                return _this._runBrowsers(rootSuite.children);
            })
            .then(function() {
                if (_this.config.coverage) {
                    return _this.coverage.processStats();
                }
            })
            .then(function() {
                _this.emit('end');
            });
    },

    _prepare: function() {
    },

    _checkGM: function() {
        return exec('gm -version')
            .then(function() {
                return true;
            })
            .fail(function() {
                return q.reject(new GeminiError(
                    'Unable to find required package: GraphicsMagick',
                    'Make sure that GraphicsMagick is installed and availiable in your PATH.\n' +
                    'Additonal info and installation instructions:\nhttp://www.graphicsmagick.org/'
                ));
            });
    },

    _runBrowsers: function(suites) {
        var _this = this;
        return q.all(Object.keys(this.config.browsers).map(function(browserId) {
            return _this.browserLauncher.launch(browserId)
                .then(function(browser) {
                    _this.emit('startBrowser', {browserId: browser.id});
                    return _this._runSuitesInBrowser(suites, browser)
                        .fin(function() {
                            _this.emit('stopBrowser', {browserId: browser.id});
                            return _this.browserLauncher.stop(browser);
                        });
                })
                .fail(function(e) {
                    _this._cancelled = true;
                    return q.reject(e);
                });
        }));
    },

    _runSuitesInBrowser: function(suites, browser) {
        var _this = this;
        return promiseUtils.seqMap(suites, function(suite) {
            return _this._runSuiteInBrowser(suite, browser);
        });
    },

    _runSuiteInBrowser: function(suite, browser) {
        if (this._cancelled) {
            return q.resolve();
        }
        var _this = this,
            eventData = {
                browserId: browser.id,
                suiteName: suite.name,
                suiteId: suite.id
            };
        this.emit('beginSuite', eventData);

        return this._runSuiteStates(suite, browser)
            .then(function() {
                return _this._runSuitesInBrowser(suite.children, browser);
            })
            .then(function() {
                _this.emit('endSuite', eventData);
            });
    },

    _runSuiteStates: function(suite, browser) {
        if (!suite.hasStates) {
            return q.resolve();
        }
        var _this = this,
            session = new CaptureSession(browser);

        return browser.open(this.config.getAbsoluteUrl(suite.url))
            .then(function() {
                return session.runHook(suite.beforeHook);
            })
            .then(function() {
                return promiseUtils.seqMap(suite.states, function(state) {
                    return _this._runStateInSession(state, session);
                });
            })
            .then(function() {
                return session.runHook(suite.afterHook);
            });
    },

    _runStateInSession: function(state, session) {
        if (this._cancelled) {
            return q.resolve();
        }
        var _this = this,
            suite = state.suite,
            eventData = {
                browserId: session.browser.id,
                suiteName: state.suite.name,
                suiteId: state.suite.id,
                stateName: state.name
            };
        if (state.shouldSkip(session.browser)) {
            _this.emit('skipState', eventData);
            return q();
        }

        _this.emit('beginState', eventData);

        return session.capture(state, {coverage: this.config.coverage})
            .then(function(data) {
                if (_this.config.coverage) {
                    _this.coverage.addStats(data.coverage);
                }
                return q(_this._processCapture({
                    suite: suite,
                    state: state,
                    browser: session.browser,
                    image: data.image
                }));
            })
            .fail(function(e) {
                if (e instanceof StateError) {
                    _this.emit('error', e);
                } else {
                    return q.reject(e);
                }
            })
            .fin(function() {
                _this.emit('endState', eventData);
            });
    },

    _processCapture: function() {
    }

});
