import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';

test('returns a service unavailable response when the database is unavailable', async () => {
  process.env.MONGODB_URI_KEY = '';
  process.env.MONGODB_URI = '';

  const { POST } = await import('@/app/api/auth/register/route');

  const request = new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      name: 'Test User',
      email: 'test@example.com',
      phone: '+254700000000',
      password: 'secret123',
    }),
  });

  const response = await POST(request);
  assert.equal(response.status, 503);

  const payload = await response.json();
  assert.match(payload.error, /service|database/i);
});
