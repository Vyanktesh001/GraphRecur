import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useGraphStore } from '../store/GraphStore';
import DashboardPage from '../pages/DashboardPage';
import RecurrenceLabPage from '../pages/RecurrenceLabPage';
import ComplexityPage from '../pages/ComplexityPage';
import { GraphTextInput } from '../components/graph/GraphTextInput';
import { renderWithProviders } from './renderWithProviders';
import { STORAGE_KEYS } from '../utils/storage';
import { makeGraph } from './helpers';

describe('Recurrence Lab', () => {
  it('generates the Fibonacci example and shows formula, initial conditions and terms', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecurrenceLabPage />);
    await user.click(screen.getByRole('button', { name: /use example: fibonacci sequence/i }));
    expect(screen.getByTestId('formula')).toHaveTextContent('a(n) = a(n-1) + a(n-2)');
    expect(screen.getByTestId('initial-conditions')).toHaveTextContent('a(0) = 0');
    expect(screen.getByTestId('initial-conditions')).toHaveTextContent('a(1) = 1');
    expect(screen.getByTestId('sequence-preview')).toHaveTextContent('0, 1, 1, 2, 3, 5, 8, 13, 21, 34');
    const table = screen.getByRole('table', { name: /terms of the sequence/i });
    expect(within(table).getAllByRole('row')).toHaveLength(11); // header + 10 terms
  });

  it('shows understandable errors for invalid input and does not generate', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecurrenceLabPage />);
    const c1 = screen.getByLabelText(/^c1/);
    await user.clear(c1);
    await user.type(c1, 'abc');
    expect(screen.getByText(/"abc" is not a valid number/i)).toBeInTheDocument();
    const count = screen.getByLabelText(/number of terms/i);
    await user.clear(count);
    await user.type(count, '0');
    expect(screen.getByText(/choose between 1 and 500/i)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /generate sequence/i }));
    expect(screen.getByText(/no sequence generated yet/i)).toBeInTheDocument();
  });

  it('steps forwards and backwards through the calculation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecurrenceLabPage />);
    await user.click(screen.getByRole('button', { name: /use example: fibonacci sequence/i }));
    const step = screen.getByTestId('recurrence-step');
    expect(step).toHaveTextContent('a(0) = 0');
    await user.click(screen.getByRole('button', { name: /next step/i }));
    await user.click(screen.getByRole('button', { name: /next step/i }));
    expect(step).toHaveTextContent('a(2) = 1·a(1) + 1·a(0)');
    expect(step).toHaveTextContent('= 1·1 + 1·0 = 1');
    await user.click(screen.getByRole('button', { name: /previous step/i }));
    expect(step).toHaveTextContent('a(1) = 1');
  });

  it('saves a configuration, lists it, and persists it in localStorage', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecurrenceLabPage />);
    await user.type(screen.getByLabelText(/name for saving/i), 'My Fib');
    await user.click(screen.getByRole('button', { name: /save configuration/i }));
    expect(await screen.findByText('My Fib')).toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.savedRecurrences) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].config.coefficients).toEqual([1, 1]);
  });

  it('shows a precision warning when Fibonacci terms exceed 2^53', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RecurrenceLabPage />);
    const count = screen.getByLabelText(/number of terms/i);
    await user.clear(count);
    await user.type(count, '100');
    await user.click(screen.getByRole('button', { name: /generate sequence/i }));
    expect(await screen.findByText(/numbers too large for exact arithmetic/i)).toBeInTheDocument();
    expect(screen.getByText(/from a\(79\) onward/i)).toBeInTheDocument();
  });
});

describe('Dashboard', () => {
  it('shows real statistics and empty states for a new user', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/no saved graphs yet/i)).toBeInTheDocument();
    expect(screen.getByText(/no sequences generated yet/i)).toBeInTheDocument();
    const saved = screen.getByText('Saved graphs').parentElement as HTMLElement;
    expect(within(saved).getByText('0')).toBeInTheDocument();
    const counts = screen.getByText('Vertices / edges').parentElement as HTMLElement;
    expect(within(counts).getByText('5 / 5')).toBeInTheDocument(); // default example graph
  });

  it('reflects graphs that were saved earlier (persistence across reloads)', () => {
    const g = makeGraph(['A', 'B'], [['A', 'B']]);
    g.name = 'Persisted graph';
    const now = new Date().toISOString();
    window.localStorage.setItem(STORAGE_KEYS.savedGraphs, JSON.stringify([{ graph: g, savedAt: now, lastUsedAt: now }]));
    window.localStorage.setItem(STORAGE_KEYS.workingGraph, JSON.stringify(g));
    renderWithProviders(<DashboardPage />);
    expect(screen.getAllByText('Persisted graph').length).toBeGreaterThan(0);
    const counts = screen.getByText('Vertices / edges').parentElement as HTMLElement;
    expect(within(counts).getByText('2 / 1')).toBeInTheDocument();
    expect(screen.queryByText(/no saved graphs yet/i)).not.toBeInTheDocument();
  });

  it('survives corrupted localStorage content', () => {
    window.localStorage.setItem(STORAGE_KEYS.workingGraph, '{not json');
    window.localStorage.setItem(STORAGE_KEYS.savedGraphs, '[{"graph": 5}]');
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText('Vertices / edges')).toBeInTheDocument();
  });
});

describe('Complexity page', () => {
  it('lists the documented bounds', () => {
    renderWithProviders(<ComplexityPage />);
    expect(screen.getAllByText('O((V + E) log V)')).toHaveLength(2); // Dijkstra and Prim
    expect(screen.getAllByText('O(V + E)').length).toBeGreaterThan(1);
    expect(screen.getByText('O(E log E)')).toBeInTheDocument();
    expect(screen.getByText('O(V²)')).toBeInTheDocument();
  });

  it('verifies on the default graph that BFS examines exactly the adjacency entries (2E for connected undirected)', () => {
    renderWithProviders(<ComplexityPage />);
    expect(screen.getAllByText(/equal, as the O\(V \+ E\) analysis predicts/i).length).toBe(2);
  });
});

describe('Graph store + manual input', () => {
  function Harness({ onApply }: { onApply: (n: number) => void }) {
    const { graph } = useGraphStore();
    return <GraphTextInput graph={graph} onApply={(g) => onApply(g.edges.length)} />;
  }

  it('applies valid text and reports errors for invalid text without applying', async () => {
    const user = userEvent.setup();
    let applied = -1;
    renderWithProviders(<Harness onApply={(n) => (applied = n)} />);
    const edges = screen.getByLabelText(/edges e/i);
    await user.clear(edges);
    await user.type(edges, 'A-B{enter}B-Z');
    await user.click(screen.getByRole('button', { name: /apply to graph/i }));
    expect(await screen.findByText(/vertex "Z"/i)).toBeInTheDocument();
    expect(applied).toBe(-1);

    await user.clear(edges);
    await user.type(edges, 'A-B{enter}B-C');
    await user.click(screen.getByRole('button', { name: /apply to graph/i }));
    await waitFor(() => expect(applied).toBe(2));
  });
});
