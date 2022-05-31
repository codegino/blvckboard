import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from 'react';
import {JsonRpcSigner} from '@ethersproject/providers';
import clsx from 'clsx';
import {Contract, providers, utils} from 'ethers';
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
    })),
  );

const IndexPage = () => {
  const [board, setBoard] = useState(() => defaultBoard());
  const [isPending, startTransition] = useTransition();
  const [walletConnected, setWalletConnected] = useState(false);

  const web3ModalRef = useRef<Web3Modal>();

  const selectedCellState = useState<CellProps>(null);
  const addressState = useState<string>(null);

  const [currentAddress, setCurrentAddress] = addressState;
  const [selectedCell, setSelectedCell] = selectedCellState;

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
          });
          setBoard(newBoard);
        });
      });
  }, []);

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
      setBoard(newBoard);
    });
    setSelectedCell(null);
  };

  return (
    <BlvckBoardProvider
      value={{
        selectedCell: selectedCellState,
        address: addressState,
      }}
    >
      <Layout title="The Blvckboard">
        <main className="flex flex-col items-center">
          <h1 className="text-3xl font-bold underline text-center mb-4">
            Welcome to the Blvck Board
          </h1>
          {selectedCell && <CellForm onCellUpdate={handleUpdateCell} />}
          {currentAddress && <div>Connected Address: {currentAddress}</div>}
          <h2>Click on a cell to view/modify content</h2>

          {!walletConnected && (
            <button onClick={connectWallet}>Connect Wallet</button>
          )}

          <div className="flex flex-col p-2 bg-[#323232]">
            {board.map((row, y) => (
              <div key={y} className="flex flex-row">
                {row.map((cell, x) => (
                  <Cell
                    x={x}
                    y={y}
                    color={cell.color}
                    key={`${x}-${y}`}
                    symbol={cell.symbol}
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
  }: {
    x: number;
    y: number;
    color: string;
    symbol: string;
  }) => {
    const {setSelectedCell, address} = useBlvckBoardState();

    const handleOnDoubleClick = () => {
      if (address) {
        setSelectedCell({
          x,
          y,
        });
      } else {
        alert('Please connect to a wallet');
      }
    };

    return (
      <div
        className={clsx(
          'flex justify-center items-center',
          'gap-[4px] min-h-[1rem] min-w-[1rem] w-4 h-4 border border-[#110011] cursor-pointer',
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
