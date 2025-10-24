import type { Session } from 'next-auth';

import GeneratorPage from '@/app/generator/page';

const getServerSession = jest.fn();

jest.mock('next-auth', () => ({
  getServerSession: (...args: unknown[]) => getServerSession(...args),
}));

jest.mock('@/lib/auth', () => {
  const authOptions = Symbol('NextAuthOptions');
  return {
    authOptions,
    getServerAuthSession: () => getServerSession(authOptions),
  };
});

jest.mock('@/app/generator/sign-in-prompt', () => {
  const SignInPrompt = (...args: unknown[]) => ['SignInPrompt', ...args];
  return { SignInPrompt };
});

jest.mock('@/app/generator/generator-client', () => ({
  __esModule: true,
  default: (...args: unknown[]) => ['GeneratorClient', ...args],
}));

const { authOptions } = jest.requireMock('@/lib/auth') as { authOptions: symbol };
const { SignInPrompt } = jest.requireMock('@/app/generator/sign-in-prompt') as {
  SignInPrompt: (...args: unknown[]) => unknown;
};
const { default: GeneratorClient } = jest.requireMock('@/app/generator/generator-client') as {
  default: (...args: unknown[]) => unknown;
};

describe('GeneratorPage', () => {
  beforeEach(() => {
    getServerSession.mockReset();
  });

  it('prompts visitors to sign in when no session is available', async () => {
    getServerSession.mockResolvedValueOnce(null);

    const result = (await GeneratorPage()) as unknown as { type: unknown };

    expect(getServerSession).toHaveBeenCalledWith(authOptions);
    expect(result.type).toBe(SignInPrompt);
  });

  it('renders the generator when a session exists', async () => {
    const session = { user: { name: 'Test User' } } satisfies Partial<Session>;
    getServerSession.mockResolvedValueOnce(session);

    const result = (await GeneratorPage()) as unknown as {
      type: unknown;
      props: { userName?: string | null };
    };

    expect(getServerSession).toHaveBeenCalledWith(authOptions);
    expect(result.type).toBe(GeneratorClient);
    expect(result.props.userName).toBe('Test User');
  });
});
