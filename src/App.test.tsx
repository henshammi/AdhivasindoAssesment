import React from 'react';
import { render, act } from '@testing-library/react';
import App from './App';

test('renders without crashing', async () => {
  const { baseElement } = render(<App />);

  // Flush async @hello-pangea/dnd updates (StackManager) — avoids act(...) warnings
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  expect(baseElement).toBeDefined();
});
