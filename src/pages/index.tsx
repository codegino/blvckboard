import React, {memo, useEffect, useState, useTransition} from 'react';
import clsx from 'clsx';
import Layout from '../components/Layout';

export function generateRandomColor(): string {
  // Only generate light colors to ensure text is easy to read
  return `hsl(${Math.random() * 360}, 100%, 50%)`;
}

const defaultBoard = () =>
  Array.from({length: 50}, () =>
    Array.from({length: 100}, () => ({
      color: null,
    })),
  );

const IndexPage = () => {
  const [board, setBoard] = useState(() => defaultBoard());
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetch('/api/blvckboard')
      .then(res => res.json())
      .then(res => {
        startTransition(() => {
          const newBoard = defaultBoard();
          res.forEach(element => {
            const [x, y] = element.coordinate.split(',');

            newBoard[y][x].color = element.color;
          });
          setBoard(newBoard);
        });
      });
  }, []);

  const handleUpdateCell = (x: number, y: number, color: string) => {
    startTransition(() => {
      const newBoard = [...board];
      newBoard[y][x].color = color;
      setBoard(newBoard);
    });
  };

  return (
    <Layout title="The Blvckboard">
      <h1 className="text-3xl font-bold underline text-center mb-4">
        Welcome to the Blvck Board
      </h1>

      <div className="flex flex-col p-2">
        {board.map((row, y) => (
          <div key={y} className="flex flex-row">
            {row.map((cell, x) => (
              <Cell
                x={x}
                y={y}
                color={cell.color}
                key={`${x}-${y}`}
                onCellUpdate={handleUpdateCell}
              />
            ))}
          </div>
        ))}
      </div>
    </Layout>
  );
};

const Cell = React.memo(
  ({
    color,
    x,
    y,
    onCellUpdate,
  }: {
    x: number;
    y: number;
    color: string;
    onCellUpdate: (x: number, y: number, color: string) => void;
  }) => {
    const handleOnDoubleClick = () => {
      fetch('/api/blvckboard/update', {
        method: 'POST',
        body: JSON.stringify({
          coordinate: `${x},${y}`,
          color: generateRandomColor(),
        }),
      })
        .then(res => res.json())
        .then(res => {
          onCellUpdate(x, y, res.color);
        });
    };

    return (
      <div
        className={clsx(
          'flex gap-[4px] min-h-[1rem] min-w-[1rem] w-4 h-4 border border-black',
        )}
        style={{
          backgroundColor: color,
        }}
        onDoubleClick={() => handleOnDoubleClick()}
      >
        &nbsp;
      </div>
    );
  },
);

Cell.displayName = 'Cell';

export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default IndexPage;
