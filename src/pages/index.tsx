import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import {JsonRpcSigner} from '@ethersproject/providers';
import clsx from 'clsx';
import {Contract, providers} from 'ethers';
import Web3Modal from 'web3modal';
import CellForm from '../components/CellForm';
import Layout from '../components/Layout';
import {
  BlvckBoardProvider,
  CellProps,
  useBlvckBoardState,
} from '../components/cell-hook';
import {abi, NFT_CONTRACT_ADDRESS} from '../constants';

const defaultBoard = () =>
  Array.from({length: 50}, () =>
    Array.from({length: 100}, () => ({
      color: null,
      symbol: null,
      owner: null,
    })),
  );

const IndexPage = () => {
  const [board, setBoard] = useState(() => defaultBoard());
  const [, startTransition] = useTransition();
  const [walletConnected, setWalletConnected] = useState(false);

  const web3ModalRef = useRef<Web3Modal>();

  const selectedCellState = useState<CellProps>(null);
  const addressState = useState<string>(null);
  const nftCountState = useState<number>(0);

  const [nftCount, setNftCount] = nftCountState;

  const [currentAddress, setCurrentAddress] = addressState;
  const [selectedCell, setSelectedCell] = selectedCellState;

  const [blocksCount, setBlocksCount] = useState(0);

  useEffect(() => {
    fetch('/api/blvckboard')
      .then(res => res.json())
      .then(res => {
        startTransition(() => {
          const newBoard = defaultBoard();
          res.forEach(element => {
            const [x, y] = element.coordinate.split(',');

            newBoard[y][x].color = element.color;
            newBoard[y][x].symbol = element.symbol;
            newBoard[y][x].owner = element.owner;
          });
          setBoard(newBoard);
        });
      });
  }, []);

  useEffect(() => {
    if (currentAddress) {
      startTransition(() => {
        const blocksTaken = board.reduce((acc, row) => {
          const count = row.filter(
            cell => cell.owner === currentAddress,
          ).length;

          return acc + count;
        }, 0);

        setBlocksCount(blocksTaken);
      });
    }
  }, [board, currentAddress]);

  const connectWallet = useCallback(async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      const signer = (await getProviderOrSigner(true)) as JsonRpcSigner;

      const address = await signer.getAddress();
      if (address) {
        setCurrentAddress(address);
      } else {
        setCurrentAddress(null);
      }
      setWalletConnected(true);
    } catch (err) {
      alert(err);
    }
  }, [setCurrentAddress]);

  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: 'mainnet',
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [connectWallet, walletConnected]);

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef?.current?.connect();

    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error
    const {chainId} = await web3Provider.getNetwork();

    if (chainId !== 1) {
      window.alert('Change the network to Mainnet');
      throw new Error('Change network to Mainnet');
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  const handleUpdateCell = (
    x: number,
    y: number,
    color: string,
    symbol: string,
  ) => {
    startTransition(() => {
      const newBoard = [...board];
      newBoard[y][x].color = color;
      newBoard[y][x].symbol = symbol;
      newBoard[y][x].owner = currentAddress;

      setBoard(newBoard);
    });
    setSelectedCell(null);
  };

  useEffect(() => {
    walletConnected &&
      (async () => {
        try {
          const provider = await getProviderOrSigner();
          const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);

          const balance = await nftContract.balanceOf(currentAddress);

          setNftCount(Number.parseInt(balance._hex, 16));
        } catch (err) {
          alert('Unable to fetch NFT balance');
        }
      })();
  }, [currentAddress, setNftCount, walletConnected]);

  return (
    <BlvckBoardProvider
      value={{
        selectedCell: selectedCellState,
        address: addressState,
        nftCount: nftCountState,
      }}
    >
      <Layout title="The Blvckboard">
        <main className="flex flex-col items-center overflow-hidden">
          <h1 className="text-3xl font-bold underline text-center my-4">
            Welcome to the Blvck Board
          </h1>
          {selectedCell && <CellForm onCellUpdate={handleUpdateCell} />}
          {currentAddress && (
            <div>
              Connected Address: {currentAddress.substring(0, 5)}...
              {currentAddress.substring(38, 42)}
            </div>
          )}
          {currentAddress && <div>Number of Blvcks: {nftCount}</div>}
          {currentAddress && (
            <div>
              Blocks Taken: {blocksCount}/{nftCount * 2}
            </div>
          )}
          <h2>Click on a cell to view/modify content</h2>

          {!walletConnected && (
            <button onClick={connectWallet} className="underline">
              Connect Wallet
            </button>
          )}

          <div
            className={
              'flex flex-col bg-[#323232] box-border border-4 border-gray-600 mt-4 w-full overflow-auto max-w-[100rem]'
            }
          >
            {board.map((row, y) => (
              <div key={y} className="flex flex-row">
                {row.map((cell, x) => (
                  <Cell
                    x={x}
                    y={y}
                    color={cell.color}
                    key={`${x}-${y}`}
                    symbol={cell.symbol}
                    owner={cell.owner}
                  />
                ))}
              </div>
            ))}
          </div>
        </main>
      </Layout>
    </BlvckBoardProvider>
  );
};

const Cell = React.memo(
  ({
    color,
    x,
    y,
    symbol,
    owner,
  }: {
    x: number;
    y: number;
    color: string;
    symbol: string;
    owner: string;
  }) => {
    const {setSelectedCell, address, nftCount} = useBlvckBoardState();

    const handleOnDoubleClick = () => {
      if (address && nftCount > 0) {
        setSelectedCell({
          x,
          y,
        });
      } else {
        alert('Connected wallet must have at least 1 Blvck');
      }
    };

    return (
      <div
        className={clsx(
          'flex justify-center items-center',
          'gap-[4px] min-h-[1rem] min-w-[1rem] w-4 h-4 border border-[#110011] cursor-pointer',
          {
            'border border-green-500': owner && address === owner,
          },
        )}
        style={{
          backgroundColor: color,
        }}
        role="presentation"
        onClick={() => handleOnDoubleClick()}
      >
        <span className="text-white text-sm">{symbol}</span>
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
