import React from 'react';
import { render, screen } from '@testing-library/react';
import Home from '../pages/index';

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
});

test('renders homepage title', () => {
  render(<Home latestNevuletter={null} />);
  expect(screen.getByText(/Hi,/i)).toBeInTheDocument();
});
