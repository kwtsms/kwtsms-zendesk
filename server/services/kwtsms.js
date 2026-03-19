const axios = require('axios');
const { KWTSMS_BASE_URL } = require('../utils/constants');

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
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

module.exports = { checkBalance, getSenderIds, getCoverage, sendSms, validatePhone };
