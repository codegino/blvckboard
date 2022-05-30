import clsx from 'clsx';
import Link from 'next/link';
import Layout from '../components/Layout';

export function generateRandomColor(): string {
  // Only generate light colors to ensure text is easy to read
  return `hsl(${Math.random() * 360}, 100%, 50%)`;
}

const defaultBoard = Array.from({length: 50}, (_, yCoord) =>
  Array.from({length: 100}, (_, xCoord) => ({
    color: null,
  })),
);

const IndexPage = ({board = defaultBoard}) => (
  <Layout title="The Blvckboard">
    <h1 className="text-3xl font-bold underline text-center mb-4">
      Welcome to the Blvck Board
    </h1>

    <div className="flex flex-col p-2">
      {board.map((row, y) => (
        <div key={y} className="flex flex-row">
          {row.map((cell, x) => (
            <div
              key={x}
              className={clsx(
                'flex gap-[4px] min-h-[1rem] min-w-[1rem] w-4 h-4 border border-black',
              )}
              style={{
                backgroundColor: cell.color,
              }}
            >
              &nbsp;
            </div>
          ))}
        </div>
      ))}
    </div>
  </Layout>
);

export const getServerSideProps = async () => {
  return {
    props: {},
  };
};

export default IndexPage;
