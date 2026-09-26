import React from 'react';
import { render, act } from '@testing-library/react';
import App from './App';

test('renders without crashing', async () => {
  const { baseElement } = render(<App />);

  // Basuh kemas kini async @hello-pangea/dnd (StackManager) — elak amaran act(...)
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  expect(baseElement).toBeDefined();
});
