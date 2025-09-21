import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

interface Node {
  id: string;
  x: number;
  y: number;
  neighbors: string[];
}

interface StackItem {
  nodeId: string;
  depth: number;
  path: string[];
}

interface GraphState {
  visited: Set<string>;
  stack: StackItem[];
  current: string | null;
  currentDepth: number;
  currentPath: string[];
  step: number;
  cutoffReached: boolean;
}

const DepthLimitedSearch = () => {
  const [graph] = useState<Node[]>([
    { id: 'A', x: 100, y: 50, neighbors: ['B', 'C'] },
    { id: 'B', x: 50, y: 150, neighbors: ['A', 'D', 'E'] },
    { id: 'C', x: 150, y: 150, neighbors: ['A', 'F'] },
    { id: 'D', x: 25, y: 250, neighbors: ['B'] },
    { id: 'E', x: 75, y: 250, neighbors: ['B', 'G'] },
    { id: 'F', x: 175, y: 250, neighbors: ['C', 'G'] },
    { id: 'G', x: 125, y: 350, neighbors: ['E', 'F'] },
  ]);

  const [depthLimit, setDepthLimit] = useState(3);
  const [state, setState] = useState<GraphState>({
    visited: new Set(),
    stack: [{ nodeId: 'A', depth: 0, path: ['A'] }],
    current: null,
    currentDepth: 0,
    currentPath: [],
    step: 0,
    cutoffReached: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [target] = useState('G');

  const reset = () => {
    setState({
      visited: new Set(),
      stack: [{ nodeId: 'A', depth: 0, path: ['A'] }],
      current: null,
      currentDepth: 0,
      currentPath: [],
      step: 0,
      cutoffReached: false,
    });
    setIsComplete(false);
    setIsPlaying(false);
  };

  const step = () => {
    if (state.stack.length === 0 || isComplete) return;

    const newStack = [...state.stack];
    const currentItem = newStack.pop()!;
    const newVisited = new Set(state.visited);
    newVisited.add(currentItem.nodeId);

    const currentNode = graph.find(n => n.id === currentItem.nodeId)!;
    let cutoffReached = state.cutoffReached;

    // Only add neighbors if we haven't reached the depth limit
    if (currentItem.depth < depthLimit) {
      const unvisitedNeighbors = currentNode.neighbors
        .filter(neighbor => 
          !newVisited.has(neighbor) && 
          !newStack.some(item => item.nodeId === neighbor)
        )
        .reverse(); // Reverse for consistent traversal order

      unvisitedNeighbors.forEach(neighbor => {
        newStack.push({
          nodeId: neighbor,
          depth: currentItem.depth + 1,
          path: [...currentItem.path, neighbor],
        });
      });
    } else if (currentNode.neighbors.some(neighbor => !newVisited.has(neighbor))) {
      // We've reached the depth limit but there are unexplored neighbors
      cutoffReached = true;
    }

    const newState = {
      visited: newVisited,
      stack: newStack,
      current: currentItem.nodeId,
      currentDepth: currentItem.depth,
      currentPath: currentItem.path,
      step: state.step + 1,
      cutoffReached,
    };

    setState(newState);

    if (currentItem.nodeId === target) {
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
    if (state.stack.some(item => item.nodeId === nodeId)) return 'fill-accent';
    return 'fill-node-default';
  };

  const getNodeStroke = (nodeId: string) => {
    if (nodeId === 'A') return 'stroke-node-start stroke-2';
    return 'stroke-border';
  };

  const handleDepthLimitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLimit = parseInt(e.target.value) || 0;
    setDepthLimit(Math.max(0, Math.min(10, newLimit)));
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center flex-wrap">
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
        <div className="flex items-center gap-2">
          <Label htmlFor="depth-limit">Depth Limit:</Label>
          <Input
            id="depth-limit"
            type="number"
            min="0"
            max="10"
            value={depthLimit}
            onChange={handleDepthLimitChange}
            className="w-20"
            disabled={isPlaying}
          />
        </div>
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
                  {/* Depth label */}
                  <text
                    x={node.x}
                    y={node.y + 35}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {state.current === node.id ? `d=${state.currentDepth}` : ''}
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
              <p className="text-sm text-muted-foreground">
                Current Depth: <span className="font-mono bg-accent px-2 py-1 rounded">{state.currentDepth}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Depth Limit: <span className="font-mono bg-accent px-2 py-1 rounded">{depthLimit}</span>
              </p>
            </div>
            
            <div>
              <p className="font-semibold mb-2">Stack (with depths):</p>
              <div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
                {state.stack.slice().reverse().map((item, index) => (
                  <span key={index} className="bg-accent text-accent-foreground px-2 py-1 rounded font-mono text-sm w-fit">
                    {item.nodeId} (d={item.depth}) {index === 0 ? '← Top' : ''}
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
              <p className="font-semibold mb-2">Current Path:</p>
              <div className="font-mono text-sm bg-muted p-2 rounded">
                {state.currentPath.join(' → ') || 'No path yet'}
              </div>
            </div>

            {state.cutoffReached && !isComplete && (
              <div className="p-4 bg-destructive/20 border border-destructive rounded">
                <p className="font-semibold text-destructive">Cutoff reached!</p>
                <p className="text-sm">Some nodes were not explored due to depth limit.</p>
              </div>
            )}

            {isComplete && (
              <div className="p-4 bg-node-goal/20 border border-node-goal rounded">
                <p className="font-semibold text-node-goal">Target found within depth limit!</p>
                <p className="font-mono mt-2">Path: {state.currentPath.join(' → ')}</p>
                <p className="font-mono">Depth: {state.currentDepth}</p>
              </div>
            )}

            {state.stack.length === 0 && !isComplete && (
              <div className="p-4 bg-destructive/20 border border-destructive rounded">
                <p className="font-semibold text-destructive">Search failed!</p>
                <p className="text-sm">Target not found within depth limit of {depthLimit}.</p>
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
              <strong>Depth-Limited Search (DLS)</strong> is a modified version of DFS that limits 
              the search to a predetermined depth level to avoid infinite loops in infinite search spaces.
            </p>
            <ol className="list-decimal ml-6 space-y-2">
              <li>Start with the initial node at depth 0</li>
              <li>Pop the top node from the stack</li>
              <li>Mark it as visited</li>
              <li>If current depth {'<'} limit, add unvisited neighbors to stack</li>
              <li>If depth limit reached, mark as cutoff</li>
              <li>Repeat until target found or stack empty</li>
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              <strong>Time Complexity:</strong> O(b^l) where b is branching factor and l is depth limit<br/>
              <strong>Space Complexity:</strong> O(l) for the stack<br/>
              <strong>Complete:</strong> Yes, if solution exists within depth limit<br/>
              <strong>Optimal:</strong> No, does not guarantee shortest path
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DepthLimitedSearch;