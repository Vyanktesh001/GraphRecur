import { RouterProvider } from 'react-router-dom';
import { ToastProvider } from '../components/ui/Toast';
import { GraphStoreProvider } from '../store/GraphStore';
import { RecurrenceStoreProvider } from '../store/RecurrenceStore';
import { router } from './router';

export default function App() {
  return (
    <ToastProvider>
      <GraphStoreProvider>
        <RecurrenceStoreProvider>
          <RouterProvider router={router} />
        </RecurrenceStoreProvider>
      </GraphStoreProvider>
    </ToastProvider>
  );
}
