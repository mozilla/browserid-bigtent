Operations Notes
================

BigTent is a BrowserID Identity Provider (IdP) Proxy service. It bridges
`gmail.com`, `yahoo.com`, and `hotmail.com` email addresses so that it looks
like Google, Yahoo, and Microsoft are running BrowserID enabled servers.

In practice, this server **looks like an IdP**!

Although it has a `/.well-known/browserid` file, *only the ``public-key``
field is used*. The [BrowserID codebase](https://github.com/mozilla/browserid)
has the provisioning and authentnication urls hardcoded into it's configs.

API Keys: Windows Live (Hotmail)
--------------------------------

While we use OpenID for Google and Yahoo, Microsoft only supports OAuth2, and
thus requires an API key. This means two things:

1.  Each domain must have a matching API key.
2.  Each API key must be provisioned by Microsoft.

Real keys are managed by Ops.

Cryptographic Keys
------------------

This server does cryptographic operations as part of the Persona Primary
protocol.

It must have public/secret keys. There are several ways to achieve this:

-   Use the environment variables `PUBLIC_KEY` and `PRIVATE_KEY`.
-   Use `scripts/gen_keys.js` to create `server_secret_key.json` and
    `server_public_key.json` in `server/var/`.
-   Do nothing and let the server generate its own "ephemeral keys," which
    will change on each restart.

Ephemeral keys are only appropriate in development environments. If deploying
in a clustered environment, all servers must have the same keypair.

The private key (`server_secret_key.json`) is *extremely sensative*, protect it!

Only the public key (`server_public_key.json`) can be shared via HTTP.

External Requests
-----------------

Documented in [Issue 23](https://github.com/mozilla/browserid-bigtent/issues/23).

Monitoring
----------

### Version

During deployment you should create `static/ver.txt`.

This should have the last git commit and SHA as well as svn version. Example
contents:

    943d308 bump to 0.2012.04.27.5, and document changes in .4 and .5
    locale svn r105105
    =======
    >>>>>>> f48a5bc... Clean up docs

### Stats

BigTent has `statsd` prefixed to `bigtent` for the following:

Counters:

-   HTTP Requests at the start of a route
-   Things we log warnings on
-   Things we log errors on
-   [Things that make you go Hmmm](http://en.wikipedia.org/wiki/Things_That_Make_You_Go_Hmmm...)

Timers:

-   HTTP Requests amount of time spent servicing request

### Heartbeat

A heartbeat is available at `/__heartbeat__`.
