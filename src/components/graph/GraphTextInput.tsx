import { useEffect, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import type { Graph } from '../../types/graph';
import { graphToText, parseGraphText } from '../../utils/graphText';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TextAreaField } from '../ui/Fields';
import { Alert } from '../ui/Feedback';

interface Props {
  graph: Graph;
  onApply: (graph: Graph) => void;
}

/** Manual input of V and E as text; replaces the current vertices and edges when applied. */
export function GraphTextInput({ graph, onApply }: Props) {
  const current = graphToText(graph);
  const [vertices, setVertices] = useState(current.vertices);
  const [edges, setEdges] = useState(current.edges);
  const [errors, setErrors] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [shownId, setShownId] = useState(graph.id);

  // Keep the form in sync with the graph unless the user is in the middle of typing;
  // always refill when a different graph is opened.
  useEffect(() => {
    if (graph.id !== shownId || !dirty) {
      setVertices(current.vertices);
      setEdges(current.edges);
      setErrors([]);
      setDirty(false);
      setShownId(graph.id);
    }
  }, [graph.id, shownId, dirty, current.vertices, current.edges]);

  const apply = () => {
    const result = parseGraphText(vertices, edges, { directed: graph.directed, weighted: graph.weighted, existing: graph, name: graph.name });
    if (result.graph) {
      setErrors([]);
      setDirty(false);
      onApply(result.graph);
    } else {
      setErrors(result.errors);
    }
  };

  const reload = () => {
    setVertices(current.vertices);
    setEdges(current.edges);
    setErrors([]);
    setDirty(false);
  };

  return (
    <Card title="Manual input" description="Type the vertex set V and edge set E, then apply.">
      <div className="space-y-3">
        <TextAreaField
          label="Vertices V"
          rows={2}
          value={vertices}
          onChange={(e) => { setVertices(e.target.value); setDirty(true); }}
          hint="Separate with commas or spaces. Example: A, B, C, D, E"
          spellCheck={false}
        />
        <TextAreaField
          label="Edges E"
          rows={6}
          value={edges}
          onChange={(e) => { setEdges(e.target.value); setDirty(true); }}
          hint={
            graph.weighted
              ? 'One edge per line: A-B 2 (weight after the vertices). '
              : 'One edge per line: A-B. Lines starting with # are ignored.'
          }
          spellCheck={false}
        />
        {errors.length > 0 && (
          <Alert kind="error" title={`${errors.length} problem${errors.length === 1 ? '' : 's'} found — nothing was changed`}>
            <ul className="list-disc pl-4">
              {errors.slice(0, 8).map((e) => (
                <li key={e}>{e}</li>
              ))}
              {errors.length > 8 && <li>…and {errors.length - 8} more.</li>}
            </ul>
          </Alert>
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={Check} onClick={apply}>
            Apply to graph
          </Button>
          <Button icon={RotateCcw} onClick={reload}>
            Reset form to current graph
          </Button>
        </div>
      </div>
    </Card>
  );
}
