function normalize(phone) {
  if (!phone) return '';
  let cleaned = String(phone);
  // Convert Arabic-Indic and Extended Arabic-Indic digits to Latin
  cleaned = cleaned.replace(/[٠-٩]/g, (c) => c.charCodeAt(0) - 0x0660);
  cleaned = cleaned.replace(/[۰-۹]/g, (c) => c.charCodeAt(0) - 0x06F0);
  // Strip every non-digit character
  cleaned = cleaned.replace(/\D/g, '');
  // Strip leading zeros (handles 00 prefix)
  cleaned = cleaned.replace(/^0+/, '');
  return cleaned;
}

function verify(phone) {
  if (!phone) return false;
  const normalized = typeof phone === 'string' && /^\d+$/.test(phone) ? phone : normalize(phone);
  if (!/^\d+$/.test(normalized)) return false;
  if (normalized.length < 8 || normalized.length > 15) return false;
  return true;
}

function deduplicate(phones) {
  return [...new Set(phones)];
}

module.exports = { normalize, verify, deduplicate };
