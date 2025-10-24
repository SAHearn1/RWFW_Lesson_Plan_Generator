import GeneratorPage from '@/app/generator/page';

const getServerAuthSession = jest.fn();

jest.mock('@/lib/auth', () => ({
  getServerAuthSession: (...args: unknown[]) => getServerAuthSession(...args),
}));

jest.mock('@/app/generator/sign-in-prompt', () => {
  const SignInPrompt = (...args: unknown[]) => ['SignInPrompt', ...args];
  return { SignInPrompt };
});

jest.mock('@/app/generator/generator-client', () => ({
  __esModule: true,
  default: (...args: unknown[]) => ['GeneratorClient', ...args],
}));

const { SignInPrompt } = jest.requireMock('@/app/generator/sign-in-prompt') as {
  SignInPrompt: (...args: unknown[]) => unknown;
};
const { default: GeneratorClient } = jest.requireMock('@/app/generator/generator-client') as {
  default: (...args: unknown[]) => unknown;
};

describe('GeneratorPage', () => {
  beforeEach(() => {
    getServerAuthSession.mockReset();
  });

  it('prompts visitors to sign in when no session is available', async () => {
    getServerAuthSession.mockResolvedValueOnce(null);

    const result = (await GeneratorPage()) as unknown as { type: unknown };

    expect(getServerAuthSession).toHaveBeenCalledWith();
    expect(result.type).toBe(SignInPrompt);
  });

  it('renders the generator when a session exists', async () => {
    const session = { user: { name: 'Test User' } };
    getServerAuthSession.mockResolvedValueOnce(session);

    const result = (await GeneratorPage()) as unknown as {
      type: unknown;
      props: { userName?: string | null };
    };

    expect(getServerAuthSession).toHaveBeenCalledWith();
    expect(result.type).toBe(GeneratorClient);
    expect(result.props.userName).toBe('Test User');
  });
});
