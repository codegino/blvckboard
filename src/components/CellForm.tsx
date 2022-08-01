import React, {useCallback, useEffect, useState} from 'react';
import {PhotoshopPicker} from 'react-color';
import {useBlvckBoardState} from './cell-hook';

const CellForm = ({onCellUpdate}) => {
  const [blockPickerColor, setBlockPickerColor] = useState('#110011');
  const [comment, setComment] = useState('');
  const [symbol, setSymbol] = useState('');
  const [isColorPickerVisible, setColorPickerVisible] = useState(false);
  const {
    selectedCell: {x, y},
    setSelectedCell,
    address,
    nftCount,
  } = useBlvckBoardState();
  const [cellInfo, setCellInfo] = useState<{
    comment: string;
    owner: string;
  }>();

  useEffect(() => {
    fetch(`/api/blvckboard/cell?x=${x}&y=${y}`)
      .then(res => res.json())
      .then(res => {
        if (res) {
          setCellInfo(res);
          setComment(res.comment);
          setSymbol(res.symbol);
          setBlockPickerColor(res.color);
        }
      });
  }, [x, y]);

  const handleSubmit = useCallback(
    e => {
      e.preventDefault();
      const body = {
        coordinate: `${x},${y}`,
        color: blockPickerColor,
        comment,
        address,
        symbol,
        nftCount,
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
            onCellUpdate(x, y, res.color, res.symbol);
            setSelectedCell(null);
          }
        });
    },
    [
      address,
      blockPickerColor,
      comment,
      nftCount,
      onCellUpdate,
      setSelectedCell,
      symbol,
      x,
      y,
    ],
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: '0',
        left: 0,
        right: 0,
        bottom: 0,
        height: '100%',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#00000089',
      }}
    >
      <div className="px-4 bg-white p-4 rounded-sm">
        <div className="flex justify-between border-b border-gray-600 pb-2 mb-4">
          <h2 className="text-2xl">
            {cellInfo?.owner === address ? 'Edit Cell' : 'Claim Cell'}
          </h2>
          <h3 className="text-xl">
            Block#: {x}:{y}
          </h3>
        </div>
        {cellInfo && (
          <div className="mb-4">
            <p>
              Owner: {cellInfo.owner === address ? <b>You</b> : cellInfo.owner}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-2">
          <div className="flex justify-between">
            <label htmlFor="comment" className="min-w-[5rem]">
              Message:&nbsp;
            </label>

            <input
              id="comment"
              className="border border-gray-500 px-4 rounded-sm w-full"
              placeholder="Leave a message"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
          </div>
          <div className="flex justify-between">
            <label htmlFor="symbol" className="min-w-[5rem]">
              Symbol:&nbsp;
            </label>

            <input
              id="symbol"
              className="border border-gray-500 px-2 rounded-sm w-full"
              placeholder="1-character symbol"
              value={symbol}
              maxLength={1}
              onChange={e => setSymbol(e.target.value)}
            />
          </div>
          {isColorPickerVisible ? (
            <PhotoshopPicker
              color={blockPickerColor}
              onAccept={() => {
                setColorPickerVisible(false);
              }}
              onChange={color => {
                setBlockPickerColor(color.hex);
              }}
              onCancel={() => setColorPickerVisible(false)}
            />
          ) : (
            <div className="flex items-center">
              <span>Color:&nbsp;</span>
              <button
                onClick={() => setColorPickerVisible(true)}
                className="inline-block border border-black"
                style={{
                  height: '1.5rem',
                  width: '1.5rem',
                  backgroundColor: blockPickerColor,
                }}
              />
            </div>
          )}
          <div className="flex justify-end gap-2">
            <button
              className="border border-gray-500 px-4 rounded-sm"
              type="button"
              onClick={() => setSelectedCell(null)}
            >
              Cancel
            </button>
            <button
              className="border border-gray-500 px-4 rounded-sm"
              type="submit"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CellForm;
