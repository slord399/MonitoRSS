const assert = require('assert');
const safeMerge = require('./safe-merge');

console.log('Running safe-merge tests...');

// Test 1: Standard merge functionality
{
  const a = { x: 1, y: { z: 2 } };
  const b = { y: { w: 3 }, v: 4 };
  const result = safeMerge(a, b);
  assert.deepStrictEqual(result, { x: 1, y: { z: 2, w: 3 }, v: 4 });
  console.log('✓ Test 1 passed: Standard merge');
}

// Test 2: __proto__ pollution prevention
{
  const malicious = JSON.parse('{"__proto__": {"polluted": true}}');
  const target = { a: 1 };
  const result = safeMerge(target, malicious);
  assert.strictEqual(({}).polluted, undefined);
  assert.strictEqual(result.polluted, undefined);
  assert.strictEqual(Object.prototype.polluted, undefined);
  console.log('✓ Test 2 passed: __proto__ pollution blocked');
}

// Test 3: constructor pollution prevention
{
  const malicious = JSON.parse('{"constructor": {"prototype": {"polluted": true}}}');
  const target = { b: 2 };
  const result = safeMerge(target, malicious);
  assert.strictEqual(({}).polluted, undefined);
  assert.strictEqual(Object.prototype.polluted, undefined);
  console.log('✓ Test 3 passed: constructor pollution blocked');
}

// Test 4: prototype key pollution prevention
{
  const malicious = { prototype: { polluted: true }, name: 'safe' };
  const target = {};
  const result = safeMerge(target, malicious);
  assert.strictEqual(({}).polluted, undefined);
  assert.deepStrictEqual(result, { name: 'safe' });
  console.log('✓ Test 4 passed: prototype property blocked');
}

// Test 5: safeMerge.all
{
  const a = { a: 1 };
  const b = JSON.parse('{"__proto__": {"polluted": true}, "b": 2}');
  const c = { c: 3 };
  const result = safeMerge.all([a, b, c]);
  assert.deepStrictEqual(result, { a: 1, b: 2, c: 3 });
  assert.strictEqual(({}).polluted, undefined);
  console.log('✓ Test 5 passed: safeMerge.all with sanitization');
}

console.log('All safe-merge tests passed successfully!');
