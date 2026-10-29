import { lazy } from 'react';
import { createHashRouter, Link } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { EmptyState } from '../components/ui/Feedback';
import { SearchX } from 'lucide-react';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const GraphExplorerPage = lazy(() => import('../pages/GraphExplorerPage'));
const AlgorithmSimulatorPage = lazy(() => import('../pages/AlgorithmSimulatorPage'));
const RecurrenceLabPage = lazy(() => import('../pages/RecurrenceLabPage'));
const ConceptsPage = lazy(() => import('../pages/ConceptsPage'));
const ComplexityPage = lazy(() => import('../pages/ComplexityPage'));

function NotFound() {
  return (
    <EmptyState icon={SearchX} title="Page not found" action={<Link to="/" className="font-medium text-navy-700 underline">Back to the dashboard</Link>}>
      That address does not match any page of GraphRecur Lab.
    </EmptyState>
  );
}

/** Hash routing keeps the built app working from any static host or even file://. */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'graphs', element: <GraphExplorerPage /> },
      { path: 'algorithms', element: <AlgorithmSimulatorPage /> },
      { path: 'recurrence', element: <RecurrenceLabPage /> },
      { path: 'concepts', element: <ConceptsPage /> },
      { path: 'concepts/:topicId', element: <ConceptsPage /> },
      { path: 'complexity', element: <ComplexityPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
]);
