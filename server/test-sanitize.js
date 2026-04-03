const sanitizeUsername = (name) => {
  if (!name || typeof name !== 'string') return 'unknown';
  return name.trim().slice(0, 50) || 'unknown';
};

const tests = [
  ['normal_user', 'normal_user'],
  ['  spaces around  ', 'spaces around'],
  ['中文用户名', '中文用户名'],
  ['user with spaces', 'user with spaces'],
  ['emoji🎄user', 'emoji🎄user'],
  ['a'.repeat(100), 'a'.repeat(50)],
  ['   ', 'unknown'],
  ['', 'unknown'],
  [null, 'unknown'],
  [undefined, 'unknown'],
  [123, 'unknown'],
];

let passed = 0;
let failed = 0;
tests.forEach(([input, expected]) => {
  const result = sanitizeUsername(input);
  if (result === expected) {
    passed++;
    console.log('PASS:', JSON.stringify(input), '->', JSON.stringify(result));
  } else {
    failed++;
    console.log('FAIL:', JSON.stringify(input), '-> got', JSON.stringify(result), ', expected', JSON.stringify(expected));
  }
});
console.log('\n' + passed + ' passed, ' + failed + ' failed');
