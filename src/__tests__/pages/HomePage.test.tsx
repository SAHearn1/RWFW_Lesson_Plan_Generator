// !STARTERCONF You should delete this page

import { render, screen } from '@testing-library/react';

import HomePage from '@/app/page';

describe('Homepage', () => {
  it('renders the brand hero content', () => {
    render(<HomePage />);

    expect(
      screen.getByRole('heading', { name: /Root Work Framework/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Begin Lesson Planning/i }),
    ).toBeInTheDocument();
  });
});
