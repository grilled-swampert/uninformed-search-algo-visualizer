import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

interface Node {
  id: string;
  x: number;
  y: number;
  neighbors: string[];
}

interface GraphState {
  visited: Set<string>;
  stack: string[];
  current: string | null;
  path: string[];
  step: number;
}

const DepthFirstSearch = () => {
  const [graph] = useState<Node[]>([
    { id: 'A', x: 100, y: 50, neighbors: ['B', 'C'] },
    { id: 'B', x: 50, y: 150, neighbors: ['A', 'D', 'E'] },
    { id: 'C', x: 150, y: 150, neighbors: ['A', 'F'] },
    { id: 'D', x: 25, y: 250, neighbors: ['B'] },
    { id: 'E', x: 75, y: 250, neighbors: ['B', 'G'] },
    { id: 'F', x: 175, y: 250, neighbors: ['C', 'G'] },
    { id: 'G', x: 125, y: 350, neighbors: ['E', 'F'] },
  ]);

  const [state, setState] = useState<GraphState>({
    visited: new Set(),
    stack: ['A'],
    current: null,
    path: [],
    step: 0,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [target] = useState('G');

  const reset = () => {
    setState({
      visited: new Set(),
      stack: ['A'],
      current: null,
      path: [],
      step: 0,
    });
    setIsComplete(false);
    setIsPlaying(false);
  };

  const step = () => {
    if (state.stack.length === 0 || isComplete) return;

    const newStack = [...state.stack];
    const current = newStack.pop()!;
    const newVisited = new Set(state.visited);
    newVisited.add(current);

    const currentNode = graph.find(n => n.id === current)!;
    
    // Add unvisited neighbors to stack (in reverse order for consistent traversal)
    const unvisitedNeighbors = currentNode.neighbors
      .filter(neighbor => !newVisited.has(neighbor) && !newStack.includes(neighbor))
      .reverse();
    
    unvisitedNeighbors.forEach(neighbor => {
      newStack.push(neighbor);
    });

    const newState = {
      visited: newVisited,
      stack: newStack,
      current,
      path: [...state.path, current],
      step: state.step + 1,
    };

    setState(newState);

    if (current === target) {
      setIsComplete(true);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (isPlaying && !isComplete) {
      const timer = setTimeout(step, 1000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, state, isComplete]);

  const getNodeColor = (nodeId: string) => {
    if (nodeId === target && isComplete) return 'fill-node-goal';
    if (state.current === nodeId) return 'fill-node-current';
    if (state.visited.has(nodeId)) return 'fill-node-visited';
    if (state.stack.includes(nodeId)) return 'fill-accent';
    return 'fill-node-default';
  };

  const getNodeStroke = (nodeId: string) => {
    if (nodeId === 'A') return 'stroke-node-start stroke-2';
    return 'stroke-border';
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <Button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={isComplete}
          variant="default"
          size="sm"
        >
          {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
          {isPlaying ? 'Pause' : 'Play'}
        </Button>
        <Button onClick={step} disabled={isPlaying || isComplete} variant="outline" size="sm">
          <SkipForward className="w-4 h-4 mr-2" />
          Step
        </Button>
        <Button onClick={reset} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Graph Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <svg width="200" height="400" viewBox="0 0 200 400" className="border rounded">
              {/* Edges */}
              {graph.map(node => 
                node.neighbors.map(neighborId => {
                  const neighbor = graph.find(n => n.id === neighborId)!;
                  return (
                    <line
                      key={`${node.id}-${neighborId}`}
                      x1={node.x}
                      y1={node.y}
                      x2={neighbor.x}
                      y2={neighbor.y}
                      stroke="hsl(var(--border))"
                      strokeWidth="2"
                    />
                  );
                })
              )}
              
              {/* Nodes */}
              {graph.map(node => (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="20"
                    className={`${getNodeColor(node.id)} ${getNodeStroke(node.id)} transition-all duration-300`}
                  />
                  <text
                    x={node.x}
                    y={node.y + 5}
                    textAnchor="middle"
                    className="text-sm font-bold fill-foreground"
                  >
                    {node.id}
                  </text>
                </g>
              ))}
            </svg>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Algorithm State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Step: {state.step}</p>
              <p className="text-sm text-muted-foreground">
                Current Node: <span className="font-mono bg-accent px-2 py-1 rounded">{state.current || 'None'}</span>
              </p>
            </div>
            
            <div>
              <p className="font-semibold mb-2">Stack (LIFO):</p>
              <div className="flex flex-col gap-1">
                {state.stack.slice().reverse().map((nodeId, index) => (
                  <span key={index} className="bg-accent text-accent-foreground px-2 py-1 rounded font-mono text-sm w-fit">
                    {nodeId} {index === 0 ? '← Top' : ''}
                  </span>
                ))}
                {state.stack.length === 0 && (
                  <span className="text-muted-foreground text-sm">Empty</span>
                )}
              </div>
            </div>

            <div>
              <p className="font-semibold mb-2">Visited:</p>
              <div className="flex gap-2 flex-wrap">
                {Array.from(state.visited).map(nodeId => (
                  <span key={nodeId} className="bg-node-visited text-foreground px-2 py-1 rounded font-mono text-sm">
                    {nodeId}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <p className="font-semibold mb-2">Path:</p>
              <div className="font-mono text-sm bg-muted p-2 rounded">
                {state.path.join(' → ') || 'No path yet'}
              </div>
            </div>

            {isComplete && (
              <div className="p-4 bg-node-goal/20 border border-node-goal rounded">
                <p className="font-semibold text-node-goal">Target found! Path to {target}:</p>
                <p className="font-mono mt-2">{state.path.join(' → ')}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Algorithm Explanation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="mb-4">
              <strong>Depth-First Search (DFS)</strong> explores as far as possible along each branch 
              before backtracking. Uses a stack (LIFO - Last In, First Out) data structure.
            </p>
            <ol className="list-decimal ml-6 space-y-2">
              <li>Start with the initial node in the stack</li>
              <li>Pop the top node from the stack</li>
              <li>Mark it as visited</li>
              <li>Push all unvisited neighbors onto the stack</li>
              <li>Repeat until the target is found or stack is empty</li>
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              <strong>Time Complexity:</strong> O(V + E) where V is vertices and E is edges<br/>
              <strong>Space Complexity:</strong> O(V) for the stack and visited set<br/>
              <strong>Note:</strong> DFS does not guarantee the shortest path
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepthFirstSearch;