import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, RotateCcw, Shuffle, SkipForward } from 'lucide-react';

interface PuzzleState {
  board: number[];
  emptyPos: number;
  cost: number;
  heuristic: number;
  path: string[];
  depth: number;
}

interface SearchState {
  openList: PuzzleState[];
  closedList: PuzzleState[];
  current: PuzzleState | null;
  step: number;
  algorithm: 'bfs' | 'dfs' | 'astar';
}

const EightPuzzle = () => {
  const goalState = [1, 2, 3, 4, 5, 6, 7, 8, 0];
  const initialState = [1, 2, 3, 4, 0, 5, 7, 8, 6];
  
  const [puzzleState, setPuzzleState] = useState<number[]>(initialState);
  const [searchState, setSearchState] = useState<SearchState>({
    openList: [],
    closedList: [],
    current: null,
    step: 0,
    algorithm: 'bfs',
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [isSolving, setIsSolving] = useState(false);

  const manhattanDistance = (board: number[]): number => {
    let distance = 0;
    for (let i = 0; i < 9; i++) {
      if (board[i] !== 0) {
        const goalPos = goalState.indexOf(board[i]);
        const currentRow = Math.floor(i / 3);
        const currentCol = i % 3;
        const goalRow = Math.floor(goalPos / 3);
        const goalCol = goalPos % 3;
        distance += Math.abs(currentRow - goalRow) + Math.abs(currentCol - goalCol);
      }
    }
    return distance;
  };

  const isGoalState = (board: number[]): boolean => {
    return board.every((val, idx) => val === goalState[idx]);
  };

  const getSuccessors = (state: PuzzleState): PuzzleState[] => {
    const successors: PuzzleState[] = [];
    const emptyPos = state.emptyPos;
    const row = Math.floor(emptyPos / 3);
    const col = emptyPos % 3;
    
    const moves = [
      { dr: -1, dc: 0, name: 'UP' },
      { dr: 1, dc: 0, name: 'DOWN' },
      { dr: 0, dc: -1, name: 'LEFT' },
      { dr: 0, dc: 1, name: 'RIGHT' },
    ];

    moves.forEach(move => {
      const newRow = row + move.dr;
      const newCol = col + move.dc;
      
      if (newRow >= 0 && newRow < 3 && newCol >= 0 && newCol < 3) {
        const newEmptyPos = newRow * 3 + newCol;
        const newBoard = [...state.board];
        
        // Swap empty space with tile
        [newBoard[emptyPos], newBoard[newEmptyPos]] = [newBoard[newEmptyPos], newBoard[emptyPos]];
        
        const newState: PuzzleState = {
          board: newBoard,
          emptyPos: newEmptyPos,
          cost: state.cost + 1,
          heuristic: manhattanDistance(newBoard),
          path: [...state.path, move.name],
          depth: state.depth + 1,
        };
        
        successors.push(newState);
      }
    });
    
    return successors;
  };

  const boardsEqual = (board1: number[], board2: number[]): boolean => {
    return board1.every((val, idx) => val === board2[idx]);
  };

  const shuffle = () => {
    if (isSolving) return;
    
    let newBoard = [...goalState];
    const emptyPos = newBoard.indexOf(0);
    
    // Perform 50 random valid moves
    let currentEmpty = emptyPos;
    for (let i = 0; i < 50; i++) {
      const row = Math.floor(currentEmpty / 3);
      const col = currentEmpty % 3;
      const validMoves = [];
      
      if (row > 0) validMoves.push(currentEmpty - 3); // UP
      if (row < 2) validMoves.push(currentEmpty + 3); // DOWN
      if (col > 0) validMoves.push(currentEmpty - 1); // LEFT
      if (col < 2) validMoves.push(currentEmpty + 1); // RIGHT
      
      const randomMove = validMoves[Math.floor(Math.random() * validMoves.length)];
      [newBoard[currentEmpty], newBoard[randomMove]] = [newBoard[randomMove], newBoard[currentEmpty]];
      currentEmpty = randomMove;
    }
    
    setPuzzleState(newBoard);
    resetSearch();
  };

  const resetSearch = () => {
    setSearchState({
      openList: [],
      closedList: [],
      current: null,
      step: 0,
      algorithm: searchState.algorithm,
    });
    setIsComplete(false);
    setIsPlaying(false);
    setIsSolving(false);
  };

  const startSolve = () => {
    if (isGoalState(puzzleState)) return;
    
    const emptyPos = puzzleState.indexOf(0);
    const initialPuzzleState: PuzzleState = {
      board: puzzleState,
      emptyPos,
      cost: 0,
      heuristic: manhattanDistance(puzzleState),
      path: [],
      depth: 0,
    };
    
    setSearchState({
      openList: [initialPuzzleState],
      closedList: [],
      current: null,
      step: 0,
      algorithm: searchState.algorithm,
    });
    setIsSolving(true);
    setIsComplete(false);
  };

  const step = () => {
    if (searchState.openList.length === 0 || isComplete) return;

    let nextState: PuzzleState;
    let newOpenList = [...searchState.openList];

    // Choose next state based on algorithm
    if (searchState.algorithm === 'bfs') {
      nextState = newOpenList.shift()!;
    } else if (searchState.algorithm === 'dfs') {
      nextState = newOpenList.pop()!;
    } else { // A*
      newOpenList.sort((a, b) => (a.cost + a.heuristic) - (b.cost + b.heuristic));
      nextState = newOpenList.shift()!;
    }

    const newClosedList = [...searchState.closedList, nextState];

    if (isGoalState(nextState.board)) {
      setSearchState({
        ...searchState,
        openList: newOpenList,
        closedList: newClosedList,
        current: nextState,
        step: searchState.step + 1,
      });
      setIsComplete(true);
      setIsPlaying(false);
      return;
    }

    // Generate successors
    const successors = getSuccessors(nextState);
    
    successors.forEach(successor => {
      const inClosed = newClosedList.some(state => boardsEqual(state.board, successor.board));
      const inOpen = newOpenList.some(state => boardsEqual(state.board, successor.board));
      
      if (!inClosed && !inOpen) {
        newOpenList.push(successor);
      }
    });

    setSearchState({
      openList: newOpenList,
      closedList: newClosedList,
      current: nextState,
      step: searchState.step + 1,
      algorithm: searchState.algorithm,
    });
  };

  useEffect(() => {
    if (isPlaying && isSolving && !isComplete) {
      const timer = setTimeout(step, 500);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, searchState, isComplete, isSolving]);

  const getTileColor = (value: number, position: number): string => {
    if (value === 0) return 'bg-muted';
    if (searchState.current && searchState.current.board[position] !== puzzleState[position]) {
      return 'bg-node-current';
    }
    return 'bg-accent hover:bg-accent/80';
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center flex-wrap">
        <Button onClick={shuffle} disabled={isSolving} variant="outline" size="sm">
          <Shuffle className="w-4 h-4 mr-2" />
          Shuffle
        </Button>
        <Select 
          value={searchState.algorithm} 
          onValueChange={(value: 'bfs' | 'dfs' | 'astar') => 
            setSearchState({...searchState, algorithm: value})
          }
          disabled={isSolving}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bfs">BFS</SelectItem>
            <SelectItem value="dfs">DFS</SelectItem>
            <SelectItem value="astar">A*</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={startSolve} disabled={isSolving || isGoalState(puzzleState)} variant="default" size="sm">
          Start Solve
        </Button>
        {isSolving && (
          <>
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
          </>
        )}
        <Button onClick={resetSearch} variant="outline" size="sm">
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>8-Puzzle Board</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
                {(searchState.current ? searchState.current.board : puzzleState).map((value, index) => (
                  <div
                    key={index}
                    className={`
                      aspect-square flex items-center justify-center text-xl font-bold rounded-lg border-2
                      ${getTileColor(value, index)}
                      ${value === 0 ? 'border-border' : 'border-border cursor-pointer'}
                      transition-all duration-300
                    `}
                  >
                    {value !== 0 && value}
                  </div>
                ))}
              </div>
              
              <div className="text-center text-sm text-muted-foreground">
                {isGoalState(searchState.current ? searchState.current.board : puzzleState) ? (
                  <span className="text-node-goal font-semibold">🎉 Puzzle Solved! 🎉</span>
                ) : (
                  `Heuristic (Manhattan Distance): ${manhattanDistance(searchState.current ? searchState.current.board : puzzleState)}`
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Search Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="font-semibold mb-2">Algorithm: {searchState.algorithm.toUpperCase()}</p>
              <p className="text-sm text-muted-foreground">
                Step: <span className="font-mono bg-accent px-2 py-1 rounded">{searchState.step}</span>
              </p>
            </div>

            {isSolving && searchState.current && (
              <>
                <div>
                  <p className="font-semibold mb-2">Current State:</p>
                  <p className="text-sm text-muted-foreground">
                    Depth: <span className="font-mono bg-accent px-2 py-1 rounded">{searchState.current.depth}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Cost: <span className="font-mono bg-accent px-2 py-1 rounded">{searchState.current.cost}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Heuristic: <span className="font-mono bg-accent px-2 py-1 rounded">{searchState.current.heuristic}</span>
                  </p>
                  {searchState.algorithm === 'astar' && (
                    <p className="text-sm text-muted-foreground">
                      f(n) = g(n) + h(n): <span className="font-mono bg-accent px-2 py-1 rounded">{searchState.current.cost + searchState.current.heuristic}</span>
                    </p>
                  )}
                </div>

                <div>
                  <p className="font-semibold mb-2">Open List Size:</p>
                  <span className="bg-accent text-accent-foreground px-2 py-1 rounded font-mono text-sm">
                    {searchState.openList.length}
                  </span>
                </div>

                <div>
                  <p className="font-semibold mb-2">Closed List Size:</p>
                  <span className="bg-node-visited text-foreground px-2 py-1 rounded font-mono text-sm">
                    {searchState.closedList.length}
                  </span>
                </div>

                <div>
                  <p className="font-semibold mb-2">Move Sequence:</p>
                  <div className="font-mono text-sm bg-muted p-2 rounded max-h-20 overflow-y-auto">
                    {searchState.current.path.join(' → ') || 'Starting position'}
                  </div>
                </div>
              </>
            )}

            {isComplete && searchState.current && (
              <div className="p-4 bg-node-goal/20 border border-node-goal rounded">
                <p className="font-semibold text-node-goal">Puzzle solved!</p>
                <p className="font-mono mt-2">Solution found in {searchState.current.depth} moves</p>
                <p className="font-mono">States explored: {searchState.closedList.length}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>8-Puzzle Problem Explanation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm max-w-none">
            <p className="mb-4">
              The <strong>8-Puzzle</strong> is a classic sliding puzzle that consists of a 3×3 grid with 
              eight numbered tiles and one empty space. The goal is to arrange the tiles in numerical order.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
              <div>
                <h4 className="font-semibold mb-2">BFS Approach:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Explores all states at depth d before depth d+1</li>
                  <li>• Guarantees optimal solution</li>
                  <li>• High memory usage</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">DFS Approach:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Explores one path completely first</li>
                  <li>• May not find optimal solution</li>
                  <li>• Lower memory usage</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">A* Approach:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Uses Manhattan distance heuristic</li>
                  <li>• Optimal and efficient</li>
                  <li>• f(n) = g(n) + h(n)</li>
                </ul>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              <strong>State Space:</strong> 9!/2 = 181,440 possible configurations<br/>
              <strong>Heuristic:</strong> Manhattan distance (sum of distances each tile is from its goal position)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EightPuzzle;