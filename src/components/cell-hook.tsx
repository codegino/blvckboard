import React, {createContext, ReactNode, useContext, useState} from 'react';
import type {Dispatch, FunctionComponent, SetStateAction} from 'react';

type ActionType = {
  selectedCell: [CellProps, Dispatch<SetStateAction<CellProps>>];
  address: [string, Dispatch<SetStateAction<string>>];
};

export const BlvckBoardContext = createContext<ActionType>(
  null as unknown as ActionType,
);

export type CellProps = {
  x: number;
  y: number;
};

export const BlvckBoardProvider: FunctionComponent<{
  value: ActionType;
  children: ReactNode;
}> = ({children, value}) => {
  return (
    <BlvckBoardContext.Provider value={value}>
      {children}
    </BlvckBoardContext.Provider>
  );
};

export const useBlvckBoardState = () => {
  const {
    selectedCell: [selectedCell, setSelectedCell],
    address: [address, setAddress],
  } = useContext(BlvckBoardContext) as {
    selectedCell: [CellProps, Dispatch<SetStateAction<CellProps>>];
    address: [string, Dispatch<SetStateAction<string>>];
  };

  return {
    selectedCell,
    setSelectedCell,
    address,
    setAddress,
  };
};
