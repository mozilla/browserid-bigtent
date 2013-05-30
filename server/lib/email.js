/* this Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const _ = require('underscore'),
config = require('./configuration.js'),
ejs = require('ejs'),
emailer = require('nodemailer'),
fs = require('fs'),
logger = require('./logging.js').logger,
path = require('path'),
statsd = require('./statsd'),
url = require('url');

/* if smtp parameters are configured, use them */
try { var smtp_params = config.get('smtp'); } catch(e) {}
if (smtp_params && smtp_params.host) {
  emailer.SMTP = {
    host: smtp_params.host,
    port: smtp_params.port
  };
  logger.info("delivering email via SMTP host: " +  emailer.SMTP.host);
  if (smtp_params.user) {
    emailer.SMTP.use_authentication = true;
    emailer.SMTP.user = smtp_params.user;
    emailer.SMTP.pass = smtp_params.pass;

    logger.info("authenticating to email host as " +  emailer.SMTP.user);
  }
}

const TEMPLATE_PATH = path.join(__dirname, "..", "views", "email_templates");

// The "gettext" function here is only used for static analysis.
// A real, locale-aware gettext function is used when in doSend.
var gettext = function(a) { return a; };
var templates = {
  "pin_verification": {
    landing: 'pin_verification',
    subject: gettext("Confirm email address for Persona"),
    templatePath: path.join(TEMPLATE_PATH, 'pin_verification.ejs')
  }
};

function withTemplate(email_type, cb) {
  if (!templates[email_type]) {
    cb(new Error("unknown email type: " + email_type));
  } else if (templates[email_type].render) {
    cb(null, templates[email_type].render);
  } else {
    fs.readFile(templates[email_type].templatePath, function(err, data) {
      if (err) { throw err; }

      var render = ejs.compile(data.toString());

      templates[email_type].render = render;

      cb(null, render);
    });
  }
}

//TODO send in localeContext
function doSend(email_type, email, context, langContext) {
  if (!templates[email_type]) {
    throw new Error("unknown email type: " + email_type);
  }

  if (config.get('email_to_console')) {
    console.log("\nVERIFICATION PIN:\n" + context.pin_code + "\n");
  } else {
    withTemplate(email_type, function(err, render) {
      var templateArgs = _.extend({
        gettext: langContext.gettext,
        format: langContext.format
      }, context);

      var mailArgs = {
        sender: "Persona <no-reply@persona.org>",
        to: email,
        subject: langContext.gettext(templates[email_type].subject),
        text: render(templateArgs)
      };

      emailer.send_mail(mailArgs, function(err, response) {
        if (err || !response) {
          logger.error("error sending email to: " + email + " - " + err);
          statsd.increment('email.' + email_type + '.sent.error');
        }
      });
    });
  }
}

exports.sendPinVerification = function(email, msgContext, langContext) {
  doSend('pin_verification', email, msgContext, langContext);
};
