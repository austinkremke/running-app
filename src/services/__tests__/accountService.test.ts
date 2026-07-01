import { getLinkedProviders } from '../accountService';

describe('getLinkedProviders', () => {
  it('returns linked identity providers from the session', () => {
    const providers = getLinkedProviders({
      user: {
        id: 'user-1',
        email: 'runner@example.com',
        identities: [
          {
            provider: 'google',
            identity_data: { email: 'runner@example.com' },
          } as never,
        ],
      },
    } as never);

    expect(providers).toEqual([
      {
        id: 'google',
        label: 'Google',
        detail: 'runner@example.com',
      },
    ]);
  });
});
