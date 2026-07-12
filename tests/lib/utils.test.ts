import test from 'node:test';
import assert from 'node:assert/strict';

import { truncateText } from '../../lib/utils';

test('truncateText returns an empty string for nullish input', () => {
  assert.equal(truncateText(undefined as unknown as string, 10), '');
  assert.equal(truncateText(null as unknown as string, 10), '');
});

test('truncateText preserves short text without ellipsis', () => {
  assert.equal(truncateText('Edau Farm', 20), 'Edau Farm');
});
