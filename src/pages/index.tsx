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
import Layout from '../components/Layout';
import {abi, NFT_CONTRACT_ADDRESS} from '../constants';

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
  const [walletConnected, setWalletConnected] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(null);

  const web3ModalRef = useRef<Web3Modal>();

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
  }, []);

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
      {currentAddress && <div>Connected Address: {currentAddress}</div>}

      {!walletConnected && (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}

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
                address={currentAddress}
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
    address,
  }: {
    x: number;
    y: number;
    color: string;
    address: string;
    onCellUpdate: (x: number, y: number, color: string) => void;
  }) => {
    const handleOnDoubleClick = () => {
      const body = {
        coordinate: `${x},${y}`,
        color: generateRandomColor(),
        address,
      };

      fetch('/api/blvckboard/update', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'content-type': 'application/json',
        },
      })
        .then(res => res.json())
        .then(res => {
          if (res.statusCode >= 0 && res.statusCode <= 500) {
            alert(res.message);
          } else {
            onCellUpdate(x, y, res.color);
          }
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
