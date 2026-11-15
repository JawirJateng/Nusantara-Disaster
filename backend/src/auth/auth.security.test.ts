import { test } from 'node:test';
import assert = require('node:assert/strict');
import { Role } from '@prisma/client';
import { RolesGuard } from './guards/roles.guard';
import { AuthService } from './auth.service';

function context(user?: { role: Role }) {
  return {
    getHandler: () => 'handler',
    getClass: () => 'class',
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as any;
}

function guardFor(required?: Role[]) {
  return new RolesGuard({ getAllAndOverride: () => required } as any);
}

test('endpoint without @Roles stays public', () => {
  assert.equal(guardFor(undefined).canActivate(context()), true);
});

test('VIEWER is rejected on a SUPER_ADMIN endpoint', () => {
  assert.equal(guardFor([Role.SUPER_ADMIN]).canActivate(context({ role: Role.VIEWER })), false);
});

test('SUPER_ADMIN is accepted', () => {
  assert.equal(guardFor([Role.SUPER_ADMIN]).canActivate(context({ role: Role.SUPER_ADMIN })), true);
});

test('missing user is rejected when a role is required', () => {
  assert.equal(guardFor([Role.OPERATOR]).canActivate(context()), false);
});

test('login does not reveal whether the email exists', async () => {
  const service = new AuthService({ user: { findUnique: async () => null } } as any, {} as any);
  await assert.rejects(
    () => service.login({ email: 'tidak-ada@example.com', password: 'apa-saja' }),
    /Invalid credentials/,
  );
});
