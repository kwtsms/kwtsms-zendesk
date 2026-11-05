const axios = require('axios');
const { KWTSMS_BASE_URL } = require('../utils/constants');
const { version } = require('../package.json');

// 2026-11-05 15:01 +03: integration name and version on every kwtSMS call (no personal data), so kwtSMS
// can count accounts per integration; version from server/package.json, #939.
const USER_AGENT = `kwtsms-zendesk/${version}`;

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'User-Agent': USER_AGENT, // 2026-11-05 15:01 +03: #939
};

async function checkBalance(username, password) {
  try {
    const response = await axios.post(`${KWTSMS_BASE_URL}/balance/`, {
      username,
      password,
    }, { headers: JSON_HEADERS, timeout: 10000 });

    const data = response.data;
    if (data.result === 'ERROR') return data;
    return {
      result: 'OK',
      available: parseFloat(data.available) || 0,
      purchased: parseFloat(data.purchased) || 0,
      raw: data,
    };
  } catch (err) {
    if (err.response && err.response.data) return err.response.data;
    return { result: 'ERROR', code: 'ERR_NETWORK', description: err.message };
  }
}

async function getSenderIds(username, password) {
  const response = await axios.post(`${KWTSMS_BASE_URL}/senderid/`, {
    username,
    password,
  }, { headers: JSON_HEADERS, timeout: 10000 });

  const data = response.data;
  if (data.result === 'ERROR') return [];
  return Array.isArray(data.senderid) ? data.senderid : [];
}

async function getCoverage(username, password) {
  const response = await axios.post(`${KWTSMS_BASE_URL}/coverage/`, {
    username,
    password,
  }, { headers: JSON_HEADERS, timeout: 10000 });

  const data = response.data;
  if (data.result === 'ERROR') return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.coverage)) return data.coverage;
  return [];
}

async function sendSms({ username, password, sender, mobile, message, test = 0 }) {
  const response = await axios.post(`${KWTSMS_BASE_URL}/send/`, {
    username,
    password,
    sender,
    mobile,
    message,
    test: String(test),
  }, { headers: JSON_HEADERS, timeout: 15000 });

  return response.data;
}

async function validatePhone(username, password, mobile) {
  const response = await axios.post(`${KWTSMS_BASE_URL}/validate/`, {
    username,
    password,
    mobile,
  }, { headers: JSON_HEADERS, timeout: 10000 });

  return response.data;
}

// 2026-11-05 15:01 +03: USER_AGENT and JSON_HEADERS exported for the offline token test, #939.
module.exports = { checkBalance, getSenderIds, getCoverage, sendSms, validatePhone, USER_AGENT, JSON_HEADERS };
