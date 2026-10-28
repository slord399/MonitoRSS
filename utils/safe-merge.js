const deepmerge = require('deepmerge');

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function isUnsafeKey(key) {
  return FORBIDDEN_KEYS.has(key);
}

function sanitize(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitize);
  }
  const clean = {};
  for (const key of Object.keys(obj)) {
    if (!isUnsafeKey(key) && Object.prototype.hasOwnProperty.call(obj, key)) {
      clean[key] = sanitize(obj[key]);
    }
  }
  return clean;
}

function safeMerge(target, source, options = {}) {
  const cleanTarget = sanitize(target);
  const cleanSource = sanitize(source);
  return deepmerge(cleanTarget, cleanSource, options);
}

safeMerge.all = function (array, options = {}) {
  const cleanArray = array.map(sanitize);
  return deepmerge.all(cleanArray, options);
};

safeMerge.sanitize = sanitize;
safeMerge.isUnsafeKey = isUnsafeKey;

module.exports = safeMerge;
module.exports.safeMerge = safeMerge;
module.exports.sanitize = sanitize;
module.exports.isUnsafeKey = isUnsafeKey;
