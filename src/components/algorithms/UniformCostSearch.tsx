import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';

interface Node {
  id: string;
  x: number;
  y: number;
  neighbors: { id: string; cost: number }[];
}

interface PriorityQueueItem {
  nodeId: string;
  cost: number;
  path: string[];
}

interface GraphState {
  visited: Set<string>;
  priorityQueue: PriorityQueueItem[];
  current: string | null;
  currentCost: number;
  currentPath: string[];
  step: number;
  costs: Map<string, number>;
}

const UniformCostSearch = () => {
  const [graph] = useState<Node[]>([
    { id: 'A', x: 100, y: 50, neighbors: [{ id: 'B', cost: 4 }, { id: 'C', cost: 2 }] },
    { id: 'B', x: 50, y: 150, neighbors: [{ id: 'A', cost: 4 }, { id: 'D', cost: 5 }, { id: 'E', cost: 1 }] },
    { id: 'C', x: 150, y: 150, neighbors: [{ id: 'A', cost: 2 }, { id: 'F', cost: 3 }] },
    { id: 'D', x: 25, y: 250, neighbors: [{ id: 'B', cost: 5 }] },
    { id: 'E', x: 75, y: 250, neighbors: [{ id: 'B', cost: 1 }, { id: 'G', cost: 2 }] },
    { id: 'F', x: 175, y: 250, neighbors: [{ id: 'C', cost: 3 }, { id: 'G', cost: 4 }] },
    { id: 'G', x: 125, y: 350, neighbors: [{ id: 'E', cost: 2 }, { id: 'F', cost: 4 }] },
  ]);

  const [state, setState] = useState<GraphState>({
    visited: new Set(),
    priorityQueue: [{ nodeId: 'A', cost: 0, path: ['A'] }],
    current: null,
    currentCost: 0,
    currentPath: [],
    step: 0,
    costs: new Map([['A', 0]]),
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [target] = useState('G');

  const reset = () => {
    setState({
      visited: new Set(),
      priorityQueue: [{ nodeId: 'A', cost: 0, path: ['A'] }],
      current: null,
      currentCost: 0,
      currentPath: [],
      step: 0,
      costs: new Map([['A', 0]]),
    });
    setIsComplete(false);
    setIsPlaying(false);
  };

  const step = () => {
    if (state.priorityQueue.length === 0 || isComplete) return;

    // Sort priority queue by cost (lowest cost first)
    const sortedQueue = [...state.priorityQueue].sort((a, b) => a.cost - b.cost);
    const currentItem = sortedQueue.shift()!;
    const remainingQueue = sortedQueue;

    const newVisited = new Set(state.visited);
    newVisited.add(currentItem.nodeId);

    const currentNode = graph.find(n => n.id === currentItem.nodeId)!;
    const newCosts = new Map(state.costs);

    // Add neighbors to priority queue if not visited
    currentNode.neighbors.forEach(neighbor => {
      if (!newVisited.has(neighbor.id)) {
        const newCost = currentItem.cost + neighbor.cost;
        const existingCost = newCosts.get(neighbor.id);
        
        if (!existingCost || newCost < existingCost) {
          newCosts.set(neighbor.id, newCost);
          
          // Remove any existing entry for this node with higher cost
          const filteredQueue = remainingQueue.filter(item => item.nodeId !== neighbor.id);
          
          filteredQueue.push({
            nodeId: neighbor.id,
            cost: newCost,
            path: [...currentItem.path, neighbor.id],
          });
          
          remainingQueue.length = 0;
          remainingQueue.push(...filteredQueue);
        }
      }
    });

    const newState = {
      visited: newVisited,
      priorityQueue: remainingQueue,
      current: currentItem.nodeId,
      currentCost: currentItem.cost,
      currentPath: currentItem.path,
      step: state.step + 1,
      costs: newCosts,
    };

    setState(newState);

    if (currentItem.nodeId === target) {
      setIsComplete(true);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    if (isPlaying && !isComplete) {
      const timer = setTimeout(step, 1500);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, state, isComplete]);

  const getNodeColor = (nodeId: string) => {
    if (nodeId === target && isComplete) return 'fill-node-goal';
    if (state.current === nodeId) return 'fill-node-current';
    if (state.visited.has(nodeId)) return 'fill-node-visited';
    if (state.priorityQueue.some(item => item.nodeId === nodeId)) return 'fill-accent';
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
            <CardTitle>Weighted Graph Visualization</CardTitle>
          </CardHeader>
          <CardContent>
            <svg width="200" height="400" viewBox="0 0 200 400" className="border rounded">
              {/* Edges with costs */}
              {graph.map(node => 
                node.neighbors.map(neighbor => {
                  const neighborNode = graph.find(n => n.id === neighbor.id)!;
                  const midX = (node.x + neighborNode.x) / 2;
                  const midY = (node.y + neighborNode.y) / 2;
                  return (
                    <g key={`${node.id}-${neighbor.id}`}>
                      <line
                        x1={node.x}
                        y1={node.y}
                        x2={neighborNode.x}
                        y2={neighborNode.y}
                        stroke="hsl(var(--border))"
                        strokeWidth="2"
                      />
                      <circle
                        cx={midX}
                        cy={midY}
                        r="12"
                        fill="hsl(var(--background))"
                        stroke="hsl(var(--border))"
                      />
                      <text
                        x={midX}
                        y={midY + 3}
                        textAnchor="middle"
                        className="text-xs font-bold fill-foreground"
                      >
                        {neighbor.cost}
                      </text>
                    </g>
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
                  {/* Cost label */}
                  <text
                    x={node.x}
                    y={node.y + 35}
                    textAnchor="middle"
                    className="text-xs fill-muted-foreground"
                  >
                    {state.costs.get(node.id) !== undefined ? `g=${state.costs.get(node.id)}` : ''}
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
                Current Cost: <span className="font-mono bg-accent px-2 py-1 rounded">{state.currentCost}</span>
              </p>
            </div>
            
            <div>
              <p className="font-semibold mb-2">Priority Queue (ordered by cost):</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {[...state.priorityQueue]
                  .sort((a, b) => a.cost - b.cost)
                  .map((item, index) => (
                    <div key={index} className="bg-accent text-accent-foreground px-2 py-1 rounded font-mono text-sm">
                      {item.nodeId} (cost: {item.cost})
                    </div>
                  ))}
                {state.priorityQueue.length === 0 && (
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

            {isComplete && (
              <div className="p-4 bg-node-goal/20 border border-node-goal rounded">
                <p className="font-semibold text-node-goal">Optimal path found to {target}!</p>
                <p className="font-mono mt-2">Path: {state.currentPath.join(' → ')}</p>
                <p className="font-mono">Total cost: {state.currentCost}</p>
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
              <strong>Uniform Cost Search (UCS)</strong> is a variant of Dijkstra's algorithm that finds 
              the minimum-cost path by always expanding the node with the lowest path cost first.
            </p>
            <ol className="list-decimal ml-6 space-y-2">
              <li>Start with the initial node in the priority queue with cost 0</li>
              <li>Remove the node with lowest cost from the priority queue</li>
              <li>Mark it as visited</li>
              <li>For each unvisited neighbor, calculate the path cost</li>
              <li>Add neighbors to priority queue with their cumulative costs</li>
              <li>Repeat until target is found</li>
            </ol>
            <p className="mt-4 text-sm text-muted-foreground">
              <strong>Time Complexity:</strong> O((V + E) log V) with a binary heap<br/>
              <strong>Space Complexity:</strong> O(V) for the priority queue<br/>
              <strong>Guarantees:</strong> Always finds the optimal (lowest cost) path
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UniformCostSearch;