function cleanMessage(text) {
  if (!text) return '';
  let cleaned = text;
  // Convert Arabic-Indic digits to Latin
  cleaned = cleaned.replace(/[٠-٩]/g, (c) => c.charCodeAt(0) - 0x0660);
  cleaned = cleaned.replace(/[۰-۹]/g, (c) => c.charCodeAt(0) - 0x06F0);
  // Strip emoji (Unicode emoji ranges)
  cleaned = cleaned.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F5FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F680}-\u{1F6FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '');
  cleaned = cleaned.replace(/[\u{FE00}-\u{FE0F}]/gu, '');
  cleaned = cleaned.replace(/[\u{1F900}-\u{1F9FF}]/gu, '');
  cleaned = cleaned.replace(/[\u{1FA00}-\u{1FA6F}]/gu, '');
  cleaned = cleaned.replace(/[\u{1FA70}-\u{1FAFF}]/gu, '');
  // Strip zero-width and invisible characters
  cleaned = cleaned.replace(/[\u{200B}-\u{200F}]/gu, '');
  cleaned = cleaned.replace(/[\u{202A}-\u{202E}]/gu, '');
  cleaned = cleaned.replace(/[\u{2060}-\u{2064}]/gu, '');
  cleaned = cleaned.replace(/\u{FEFF}/gu, '');
  // Strip control characters (keep \n \r \t)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
  return cleaned;
}

function renderTemplate(template, data) {
  if (!template) return '';
  return template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
    return data[key] !== undefined ? String(data[key]) : '';
  });
}

module.exports = { cleanMessage, renderTemplate };
