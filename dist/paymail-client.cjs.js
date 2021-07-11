'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var brfc = require('@moneybutton/brfc');
var _defineProperty = require('@babel/runtime/helpers/defineProperty');
require('abort-controller/polyfill');
var AbortController = require('abort-controller');
var moment = require('moment');
var fetch = require('cross-fetch');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var AbortController__default = /*#__PURE__*/_interopDefaultLegacy(AbortController);
var moment__default = /*#__PURE__*/_interopDefaultLegacy(moment);
var fetch__default = /*#__PURE__*/_interopDefaultLegacy(fetch);

const CapabilityCodes = {
  pki: 'pki',
  paymentDestination: 'paymentDestination',
  requestSenderValidation: brfc.brfc('bsvalias Payment Addressing (Payer Validation)', ['andy (nChain)'], ''),
  verifyPublicKeyOwner: brfc.brfc('bsvalias public key verify (Verify Public Key Owner)', [], ''),
  publicProfile: brfc.brfc('Public Profile (Name & Avatar)', ['Ryan X. Charles (Money Button)'], '1'),
  receiveTransaction: brfc.brfc('Send raw transaction', ['Miguel Duarte (Money Button)', 'Ryan X. Charles (Money Button)', 'Ivan Mlinaric (Handcash)', 'Rafa (Handcash)'], '1.1'),
  p2pPaymentDestination: brfc.brfc('Get no monitored payment destination (p2p payment destination)', ['Miguel Duarte (Money Button)', 'Ryan X. Charles (Money Button)', 'Ivan Mlinaric (Handcash)', 'Rafa (Handcash)'], '1.1')
};

// import { DnsOverHttps } from "./dns-over-https"
class DnsClient {
  constructor(dns, doh) {
    this.dns = dns;
    this.doh = doh;
  }

  async checkSrv(aDomain) {
    return new Promise((resolve, reject) => {
      this.dns.resolveSrv(`_bsvalias._tcp.${aDomain}`, async (err, result) => {
        try {
          if (err && (err.code === 'ENODATA' || err.code === 'ENOTFOUND')) {
            return resolve({
              domain: aDomain,
              port: 443,
              isSecure: true
            });
          }

          if (err) {
            return reject(err);
          }

          const {
            name: domainFromDns,
            port,
            isSecure
          } = result[0];
          resolve({
            domain: domainFromDns,
            port,
            isSecure: this.checkDomainIsSecure(domainFromDns, aDomain) || isSecure
          });
        } catch (err) {
          return reject(err);
        }
      });
    }).then(result => {
      if (result.isSecure) {
        return result;
      } else {
        return this.validateDnssec(aDomain);
      }
    }, err => {
      console.error(err);
      return err;
    });
  }

  checkDomainIsSecure(srvResponseDomain, originalDomain) {
    if (this.domainsAreEqual(srvResponseDomain, originalDomain)) {
      return true;
    } else if (this.responseIsWwwSubdomain(srvResponseDomain, originalDomain)) {
      return true;
    } else if (this.isHandcashDomain(originalDomain)) {
      // tell rafa to fix handcash and we can remove the special case :)
      return this.domainsAreEqual('handcash-paymail-production.herokuapp.com', srvResponseDomain) || this.domainsAreEqual('handcash-cloud-production.herokuapp.com', srvResponseDomain);
    } else if (this.isHandcashInternalDomain(originalDomain)) {
      return this.domainsAreEqual('handcash-cloud-staging.herokuapp.com', srvResponseDomain);
    } else if (this.domainsAreEqual('localhost', srvResponseDomain)) {
      return true;
    } else if (this.isMoneyButtonDomain(srvResponseDomain)) {
      return true;
    } else {
      return false;
    }
  }

  isMoneyButtonDomain(aDomain) {
    return this.domainsAreEqual(aDomain, 'moneybutton.com') || this.domainsAreEqual(aDomain, 'www.moneybutton.com');
  }

  responseIsWwwSubdomain(srvResponseDomain, originalDomain) {
    return this.domainsAreEqual(srvResponseDomain, `www.${originalDomain}`);
  }

  isHandcashDomain(aDomain) {
    return this.domainsAreEqual('handcash.io', aDomain);
  }

  isHandcashInternalDomain(aDomain) {
    return this.domainsAreEqual('internal.handcash.io', aDomain);
  }

  async validateDnssec(aDomain) {
    const dnsResponse = await this.doh.queryBsvaliasDomain(aDomain);

    if (dnsResponse.Status !== 0 || !dnsResponse.Answer) {
      throw new Error('Insecure domain.');
    }

    const data = dnsResponse.Answer[0].data.split(' ');
    const port = data[2];
    const responseDomain = data[3];

    if (!dnsResponse.AD && !this.domainsAreEqual(aDomain, responseDomain)) {
      throw new Error('Insecure domain.');
    }

    return {
      port,
      domain: responseDomain,
      isSecure: dnsResponse.AD
    };
  }

  domainsAreEqual(domain1, domain2) {
    return domain1.toLowerCase().replace(/\.$/, '') === domain2.toLowerCase().replace(/\.$/, '');
  }

}

class DnsOverHttps {
  constructor(fetch, config) {
    this.fetch = fetch;
    this.config = config;
  }

  async resolveSrv(aDomain) {
    const response = await this.fetch(`${this.config.baseUrl}?name=${aDomain}&type=SRV&cd=0`);
    const body = await response.json();
    return body;
  }

  async queryBsvaliasDomain(aDomain) {
    return this.resolveSrv(`_bsvalias._tcp.${aDomain}`);
  }

}

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty__default['default'](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class Http {
  constructor(fetch) {
    this.fetch = fetch;
  }

  async get(url) {
    return this._basicRequest(url);
  }

  async postJson(url, body) {
    return this._basicRequest(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }

  async _basicRequest(url, options = {}) {
    const controller = new AbortController__default['default']();
    const timer = setTimeout(() => controller.abort(), 30000);
    return this.fetch(url, _objectSpread(_objectSpread({}, options), {}, {
      credentials: 'omit',
      signal: controller.signal
    })).then(result => {
      clearTimeout(timer);
      return result;
    });
  }

}

class EndpointResolver {
  constructor(dns = null, fetch) {
    this.dnsClient = new DnsClient(dns, new DnsOverHttps(fetch, {
      baseUrl: 'https://dns.google.com/resolve'
    }));
    this.http = new Http(fetch);
    this._cache = {};
  }

  static create(dnsClient, fetch) {
    const instance = new EndpointResolver(null, fetch);
    instance.dnsClient = dnsClient;
    return instance;
  }

  async getIdentityUrlFor(aPaymail) {
    const [alias, domain] = aPaymail.split('@');
    await this.ensureCapabilityFor(domain, CapabilityCodes.pki);
    const apiDescriptor = await this.getApiDescriptionFor(domain);
    const identityUrl = apiDescriptor.capabilities.pki.replace('{alias}', alias).replace('{domain.tld}', domain);
    return identityUrl;
  }

  async getAddressUrlFor(aPaymail) {
    const [alias, domain] = aPaymail.split('@');
    await this.ensureCapabilityFor(domain, CapabilityCodes.paymentDestination);
    const apiDescriptor = await this.getApiDescriptionFor(domain);
    const addressUrl = apiDescriptor.capabilities.paymentDestination.replace('{alias}', alias).replace('{domain.tld}', domain);
    return addressUrl;
  }

  async getVerifyUrlFor(aPaymail, aPubkey) {
    const [alias, domain] = aPaymail.split('@');
    await this.ensureCapabilityFor(domain, CapabilityCodes.verifyPublicKeyOwner);
    const apiDescriptor = await this.getApiDescriptionFor(domain);
    const url = apiDescriptor.capabilities[CapabilityCodes.verifyPublicKeyOwner].replace('{alias}', alias).replace('{domain.tld}', domain).replace('{pubkey}', aPubkey);
    return url;
  }

  async getPublicProfileUrlFor(aPaymail) {
    const [alias, domain] = aPaymail.split('@');
    await this.ensureCapabilityFor(domain, CapabilityCodes.publicProfile);
    const apiDescriptor = await this.getApiDescriptionFor(domain);
    const url = apiDescriptor.capabilities[CapabilityCodes.publicProfile].replace('{alias}', alias).replace('{domain.tld}', domain);
    return url;
  }

  async getSendTxUrlFor(aPaymail) {
    const [alias, domain] = aPaymail.split('@');
    await this.ensureCapabilityFor(domain, CapabilityCodes.receiveTransaction);
    const apiDescriptor = await this.getApiDescriptionFor(domain);
    const url = apiDescriptor.capabilities[CapabilityCodes.receiveTransaction].replace('{alias}', alias).replace('{domain.tld}', domain);
    return url;
  }

  async getP2pPatmentDestinationUrlFor(aPaymail) {
    const [alias, domain] = aPaymail.split('@');
    await this.ensureCapabilityFor(domain, CapabilityCodes.p2pPaymentDestination);
    const apiDescriptor = await this.getApiDescriptionFor(domain);
    const url = apiDescriptor.capabilities[CapabilityCodes.p2pPaymentDestination].replace('{alias}', alias).replace('{domain.tld}', domain);
    return url;
  }

  async domainHasCapability(aDomain, capability) {
    const apiDescriptor = await this.getApiDescriptionFor(aDomain);
    return !!apiDescriptor.capabilities[capability];
  }

  async getApiDescriptionFor(aDomain) {
    if (this._cache[aDomain]) {
      return this._cache[aDomain];
    }

    const {
      domain,
      port
    } = await this.getWellKnownBaseUrl(aDomain);
    const apiDescriptor = this.fetchApiDescriptor(domain, port);
    this._cache[aDomain] = apiDescriptor;
    return apiDescriptor;
  }

  async fetchApiDescriptor(domain, port) {
    const protocol = domain === 'localhost' || domain === 'localhost.' ? 'http' : 'https';
    const requestPort = port === undefined || port.toString() === '443' ? '' : `:${port}`;
    const requestDomain = /^(.*?)\.?$/.exec(domain)[1]; // Get value from capture group

    if (!requestDomain) {
      throw new Error(`Invalid domain: ${domain}`);
    }

    const wellKnown = await this.http.get(`${protocol}://${requestDomain}${requestPort}/.well-known/bsvalias`);
    const apiDescriptor = await wellKnown.json();
    return apiDescriptor;
  }

  async getWellKnownBaseUrl(aDomain) {
    return this.dnsClient.checkSrv(aDomain);
  }

  async ensureCapabilityFor(aDomain, aCapability) {
    if (!(await this.domainHasCapability(aDomain, aCapability))) {
      throw new Error(`Unknown capability "${aCapability}" for "${aDomain}"`);
    }
  }

}

class VerifiableMessage {
  constructor(parts, bsv = null) {
    if (bsv === null) {
      bsv = require('bsv');
      bsv.Message = require('bsv/message');
    }

    this.bsv = bsv;
    const concatenated = Buffer.from(parts.join(''));
    this.message = new this.bsv.Message(concatenated);
  }

  static forBasicAddressResolution({
    senderHandle,
    amount,
    dt,
    purpose
  }) {
    if (dt.toISOString) {
      dt = dt.toISOString();
    }

    return new VerifiableMessage([senderHandle, amount || '0', dt, purpose]);
  }

  sign(wifPrivateKey) {
    return this.message.sign(this.bsv.PrivateKey.fromWIF(wifPrivateKey));
  }

  verify(keyAddress, signature) {
    return this.message.verify(keyAddress, signature);
  }

}

class RequestBodyFactory {
  constructor(clock) {
    this.clock = clock;
  }

  buildBodyToRequestAddress(senderInfo, privateKey = null) {
    const {
      senderHandle,
      amount,
      senderName,
      purpose,
      pubkey,
      signature: providedSignature
    } = senderInfo;

    if (!providedSignature && privateKey === null) {
      throw new Error('Missing private key or signature');
    }

    let dt, signature;

    if (providedSignature) {
      if (!senderInfo.dt) {
        throw new Error('missing datetime for given signature');
      }

      dt = senderInfo.dt;
      signature = providedSignature;
    } else {
      dt = this.clock.now();
      signature = VerifiableMessage.forBasicAddressResolution({
        senderHandle,
        amount,
        dt,
        purpose
      }).sign(privateKey);
    }

    return {
      senderHandle,
      senderName,
      purpose,
      dt,
      amount: amount || null,
      pubkey,
      signature
    };
  }

  buildBodySendTx(hexTransaction, reference, metadata) {
    return {
      hex: hexTransaction,
      metadata,
      reference
    };
  }

  buildBodyP2pPaymentDestination(satoshis) {
    return {
      satoshis
    };
  }

}

class Clock {
  now() {
    return moment__default['default']();
  }

}

class PaymailNotFound extends Error {
  constructor(message, paymail) {
    super(message);
    this.paymail = paymail;
  }

}

class BrowserDns {
  constructor(fetch) {
    this.doh = new DnsOverHttps(fetch, {
      baseUrl: 'https://dns.google.com/resolve'
    });
  }

  async resolveSrv(aDomain, aCallback) {
    try {
      const response = await this.doh.resolveSrv(aDomain);

      if (response.Status === 0 && response.Answer) {
        const data = response.Answer.map(record => {
          const [priority, weight, port, name] = record.data.split(' ');
          return {
            priority,
            weight,
            port,
            name,
            isSecure: response.AD
          };
        });
        aCallback(null, data);
      } else if (!response.Answer) {
        // ignore check response.Status === 0
        aCallback({
          code: 'ENODATA'
        });
      } else {
        aCallback(new Error('error during dns query'));
      }
    } catch (e) {
      aCallback(e);
    }
  }

}

class PaymailClient {
  constructor(dns = null, fetch2 = null, clock = null, bsv = null) {
    if (fetch2 === null) {
      fetch2 = fetch__default['default'];
    }

    if (dns === null) {
      dns = new BrowserDns(fetch2);
    }

    if (bsv === null) {
      bsv = require('bsv');
    }

    this.bsv = bsv;
    this.resolver = new EndpointResolver(dns, fetch2);
    this.http = new Http(fetch2);
    this.requestBodyFactory = new RequestBodyFactory(clock !== null ? clock : new Clock());
  }
  /**
   * Uses pki flow to query for an identity key for a given paymail address.
   *
   * @param {String} paymail - a paymail address
   */


  async getPublicKey(paymail) {
    const identityUrl = await this.resolver.getIdentityUrlFor(paymail);
    const response = await this.http.get(identityUrl);
    const {
      pubkey
    } = await response.json();
    return pubkey;
  }
  /**
   * Uses `Basic Address Resolution` flow to query for a payment for output for the
   * given paymail address.
   *
   * @param {String} aPaymail - a paymail address
   * @param {Object} senderInfo - Object containing sender info
   * @param {String} senderInfo.senderHandle - Sender paymail address
   * @param {String} senderInfo.amount - Optional. Required amount.
   * @param {String} senderInfo.senderName - Optional. Sender name.
   * @param {String} senderInfo.purpose - Optional. Purpose of the payment.
   * @param {String} senderInfo.pubkey - Optional. Public key used to sign the message.
   * @param {String} senderInfo.signature - Optional. Valid signature according to paymail specification.
   * @param {String} privateKey - Optional. private key to sign the request.
   */


  async getOutputFor(aPaymail, senderInfo, privateKey = null) {
    const addressUrl = await this.resolver.getAddressUrlFor(aPaymail);
    const response = await this.http.postJson(addressUrl, this.requestBodyFactory.buildBodyToRequestAddress(senderInfo, privateKey));

    if (!response.ok) {
      throw new PaymailNotFound(`Paymail not found: ${aPaymail}`, aPaymail);
    }

    const {
      output
    } = await response.json();
    return output;
  }
  /**
   * Verify if the given public address belongs to the given
   * paymail address.
   *
   * @param {String} pubkey - Public key to check.
   * @param {String} paymail - a paymail address
   */


  async verifyPubkeyOwner(pubkey, paymail) {
    const url = await this.resolver.getVerifyUrlFor(paymail, pubkey);
    const response = await this.http.get(url);
    const body = await response.json();
    const {
      match
    } = body;
    return match;
  }
  /**
   * Verifies if a given signature is valid for a given message. It uses
   * different strategies depending on the capabilities of the server
   * and the parameters Given. The priority order is.
   * - If paymail is not provided, then normal signature verification is performed.
   * - Use provided key (and check that belongs to given paymail address).
   * - Get a new pubkey for given paymail address using pki.
   * - If there is no way to intereact with the owner of the domain to verify the public key it returns false.
   *
   * @param {Message} message - Message to verify
   * @param {String} signature - Signature
   * @param {String} paymail - Signature owner paymail
   * @param {String} pubkey - Optional. Public key that validates the signature.
   */


  async isValidSignature(message, signature, paymail = null, pubkey = null) {
    if (paymail == null && pubkey === null) {
      throw new Error('Must specify either paymail or pubkey');
    }

    let senderPublicKey;

    if (paymail) {
      if (pubkey && (await this.resolver.domainHasCapability(paymail.split('@')[1], CapabilityCodes.verifyPublicKeyOwner))) {
        if (await this.verifyPubkeyOwner(pubkey, paymail)) {
          senderPublicKey = this.bsv.PublicKey.fromString(pubkey);
        } else {
          return false;
        }
      } else {
        const hasPki = await this.resolver.domainHasCapability(paymail.split('@')[1], CapabilityCodes.pki);

        if (hasPki) {
          const identityKey = await this.getPublicKey(paymail);
          senderPublicKey = this.bsv.PublicKey.fromString(identityKey);
        } else {
          return false;
        }
      }
    }

    const senderKeyAddress = this.bsv.Address.fromPublicKey(senderPublicKey || pubkey);

    try {
      const verified = message.verify(senderKeyAddress.toString(), signature);
      return verified;
    } catch (err) {
      return false;
    }
  }
  /**
   * Gets the public profile information using the "Public Profile" protocol.
   *
   * @param {String} paymail - a paymail address
   * @param {String} s - the preferred size of the image
   */


  async getPublicProfile(paymail) {
    const publicProfileUrl = await this.resolver.getPublicProfileUrlFor(paymail);
    const response = await this.http.get(publicProfileUrl);

    if (!response.ok) {
      const body = await response.json();
      throw new Error(`Server failed with: ${JSON.stringify(body)}`);
    }

    const {
      avatar,
      name
    } = await response.json();
    return {
      avatar,
      name
    };
  }

  async sendRawTx(targetPaymail, hexTransaction, reference, metadata = {}) {
    if (!hexTransaction) {
      throw new Error('transaction hex cannot be empty');
    }

    const receiveTxUrl = await this.resolver.getSendTxUrlFor(targetPaymail);
    const response = await this.http.postJson(receiveTxUrl, this.requestBodyFactory.buildBodySendTx(hexTransaction, reference, metadata));

    if (!response.ok) {
      const body = await response.json();
      throw new Error(`Server failed with: ${JSON.stringify(body)}`);
    }

    return response.json();
  }

  async getP2pPaymentDestination(targetPaymail, satoshis) {
    if (!satoshis) {
      throw new Error('Amount in satohis needs to be specified');
    }

    const paymentDestinationUrl = await this.resolver.getP2pPatmentDestinationUrlFor(targetPaymail);
    const response = await this.http.postJson(paymentDestinationUrl, this.requestBodyFactory.buildBodyP2pPaymentDestination(satoshis));

    if (!response.ok) {
      const body = await response.json();
      throw new Error(`Server failed with: ${JSON.stringify(body)}`);
    }

    const body = await response.json();

    if (!body.outputs) {
      throw new Error('Server answered with a wrong format. Missing outputs');
    }

    return body;
  }

}

exports.BrowserDns = BrowserDns;
exports.CapabilityCodes = CapabilityCodes;
exports.Clock = Clock;
exports.PaymailClient = PaymailClient;
exports.PaymailNotFound = PaymailNotFound;
exports.RequestBodyFactory = RequestBodyFactory;
exports.VerifiableMessage = VerifiableMessage;
//# sourceMappingURL=paymail-client.cjs.js.map
