import type { ReactElement } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ToastProvider } from '../components/ui/Toast';
import { GraphStoreProvider } from '../store/GraphStore';
import { RecurrenceStoreProvider } from '../store/RecurrenceStore';

export function renderWithProviders(ui: ReactElement, route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <ToastProvider>
        <GraphStoreProvider>
          <RecurrenceStoreProvider>{ui}</RecurrenceStoreProvider>
        </GraphStoreProvider>
      </ToastProvider>
    </MemoryRouter>,
  );
}
