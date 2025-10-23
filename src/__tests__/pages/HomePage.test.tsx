import HomePage from '@/app/page';

const redirect = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => redirect(...args),
}));

describe('Homepage', () => {
  beforeEach(() => {
    redirect.mockClear();
  });

  it('redirects visitors to the lesson plan generator', () => {
    HomePage();

    expect(redirect).toHaveBeenCalledWith('/generator');
  });
});
