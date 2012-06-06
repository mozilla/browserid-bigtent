/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const
assert = require('assert'),
validate = require('../lib/validation/email'),
vows = require('vows');

var suite = vows.describe('email-validation-test');
suite.addBatch({
  'We only want to work with valid email': {
    topic: 'alice@example.com',
    'Valid email address is good to go': function (email) {
        assert.isTrue(validate(email));
    }
  },
  'Some weird symbols': {
    topic: 'ALICE+._-noSpam@example.com',
    '+ . _ - are acceptable': function (email) {
        assert.isTrue(validate(email));
    }
  },
  'Invalid emails should be caught': {
    topic: 'alice@badexample',
    'No TLD': function (email) {
        assert.isFalse(validate(email));
    }
  }
});

if (process.argv[1] === __filename) {
  suite.run();
} else {
  suite.export(module);
}
