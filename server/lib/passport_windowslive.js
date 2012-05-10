/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const config = require('./configuration');
const WindowsLiveStrategy = require('passport-windowslive').Strategy;
const logger = require('./logging').logger;
const passport = require('passport');
const session = require('./session_context');

// TODO: These should probably come out of some config file somewhere.
// TODO: Delete the registration for the testing app...
const CLIENT_ID = '00000000440BCC94';
const CLIENT_SECRET = 'NgepFX4ectJP-l-5XOymSqk4aLy7DJrE';
const RETURN_URL = 'https://dev.bigtent.mozilla.org/auth/windowslive/callback';

passport.use(new WindowsLiveStrategy({
    clientID: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    callbackURL: RETURN_URL
  },
  function(accessToken, refreshToken, profile, done) {
    logger.debug('passport.use(new WindowsLiveStrategy profile=', profile);
    process.nextTick(function() {
      return done(null, profile._json);
    });
  }
));

exports.init = function(app, clientSessions) {
  app.use(passport.initialize());
  app.use(passport.session());
};

exports.views = function(app) {
  // GET /auth/windowslive/callback
  // Use passport.authenticate() as route middleware to authenticate the
  // request. If authentication fails, the user will be redirected to an error
  // page. Otherwise, the primary route function function will be called.
  app.get('/auth/windowslive/callback',
    passport.authenticate('windowslive', { failureRedirect: '/error' }),
    function(req, res) {
      logger.debug('/auth/windowslive/return callback');

      var match = false;
      var claimedEmail = session.getClaimedEmail(req);
      var email;
      var emailType;

      // TODO: How should we handle the user authing as a different address than
      // we expect or want?
      if (req.user && req.user.emails) {
        for (emailType in req.user.emails) {
          if (!match && req.user.emails.hasOwnProperty(emailType)) {
            email = req.user.emails[emailType];
            if (email && email.toLowerCase() === claimedEmail.toLowerCase()) {
              match = true;
              session.clearClaimedEmail(req);
              session.setCurrentUser(req, email);
              res.redirect(session.getBidUrl(req));
            }
          }
        }
      } else {
        logger.warn('Windows Live should have user and user.emails' + req.user);
        return;
      }

      if (!match) {
        logger.error('No email matched...');
        res.redirect('/error');
      }
    }
  );
};
