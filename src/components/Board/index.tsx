import React, { MouseEvent, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addDelay, getRandomNr } from '../../helpers/methods';
import { useMockPlayer } from '../../hooks/useMockPlayer';
import { addGuess, setShips } from '../../redux/slice/game';
import { RootState } from '../../redux/store';

export const MAX_BOARD_UNITS = 10;
const maxUnits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export const Board = ({ player }: IBoard) => {
    const dispatch = useDispatch();
    const enemy = useMockPlayer();
    const me = useSelector((state: RootState) => state.player);
    const { ships, guesses, whoNext, winner } = useSelector((state: RootState) => state.game);

    useEffect(() => {
        
    }, []);

    useEffect(() => {
        // It's enemy's turn
        if (whoNext != me.uuid) {
            addEnemyHit();
        }
        
    }, [whoNext]);

    useEffect(() => {
        // Debug guesses

    }, [guesses]);

    const checkHandler = (uuid: string, position: TPosition) => {
        if (whoNext != me.uuid || winner) return;

        const enemyUUID = Object.keys(ships).filter(el => el != me.uuid)[0];
        const isHit = ships[enemyUUID].filter(el => JSON.stringify(el.positions).includes(JSON.stringify(position))).length;

        // Append to Guesses array
        addGuessHandler({
            uuid: uuid,
            uuidTarget: enemyUUID,
            position: position,
            hit: isHit,
        });
    }

    const addGuessHandler = (opts: IAddGuess) => {
        dispatch(addGuess({
            uuid: opts.uuid,
            uuidTarget: opts.uuidTarget,
            position: opts.position,
            hit: opts.hit,
        }));
    }

    /**
     * MAKE SURE THE AI REMOVES GUESSES FROM GENERATING RANDOM
     * OR, create a recursive method and check if the new position exists in GUESSES first
     */
    const addEnemyHit = async () => {
        if (winner) return;
        console.log('Wait for player to hit');

        const generateGuess = (): TPosition => {
            const existingGuessesPositions = guesses
                                .filter(el => el.uuid != enemy.uuid)
                                .map(el => el.position);

            let availablePositions: TPosition[] = [];
            for (let i = 0; i < MAX_BOARD_UNITS; i ++) {
                for (let j = 0; j < MAX_BOARD_UNITS; j ++) {
                    if (!JSON.stringify(existingGuessesPositions).includes(JSON.stringify([i, j]))) {
                        availablePositions.push([i, j]);
                    }
                }
            }
            
            let position: TPosition = availablePositions[getRandomNr(availablePositions.length)];

            return position;
        };

        const newGuess = generateGuess();

        const enemyUUID = Object.keys(ships).filter(el => el != me.uuid)[0] || enemy.uuid; // We use this the one WHO HITS NOW
        const isHit = ships[me.uuid] ? ships[me.uuid].filter(el => JSON.stringify(el.positions).includes(JSON.stringify(newGuess))).length : 0;

        await addDelay(() => {}, 500);

        addGuessHandler({
            uuid: enemyUUID,
            uuidTarget: me.uuid,
            position: newGuess,
            hit: isHit,
        });
    }

    return(
        <div className="board-display">
            <h2>Player: {player.username}</h2>
            <div className="board-wrapper">
                <div className="board" data-player={player.uuid}>
                    {maxUnits.map((row, idxRow) => {
                        return(
                            <div key={idxRow} className='row'>
                                {maxUnits.map((item, idxItem) => {
                                    const itemCoords = [idxItem, idxRow];

                                    return <Item 
                                                key={`row-${idxItem}`} 
                                                value={[itemCoords[0], itemCoords[1]]} 
                                                actionDisabled={player.uuid != me.uuid}
                                                playerUUID={player.uuid}
                                                playerShips={ships[player.uuid]}
                                                checkHandler={checkHandler}
                                            />
                                })}
                            </div>
                        );
                    })}
                </div>

            </div> 
        </div>
    );
};

export const Item = ({ value, playerUUID, checkHandler, actionDisabled, playerShips }: IBoardItem) => {
    const { guesses } = useSelector((state: RootState) => state.game);
    let shipFragment = false;
    let shipName = '';
    let classes = '';

    const isHit = guesses.filter(guessEl => {
        return guessEl.uuid == playerUUID && JSON.stringify(guessEl.position) == JSON.stringify(value);
    });

    playerShips && playerShips.forEach((shipEl) => {
        if (!shipFragment && JSON.stringify(shipEl.positions).includes(JSON.stringify(value))) {
            shipName = shipEl.ship;
            classes += ` ${shipEl.color}`;
            shipFragment = true;
        }
    });

    if (shipFragment) classes += ' ship-fragment';

    if (isHit && isHit[0]) {
        classes += isHit[0].hit ? ' hit' : ' miss';
    }

    const handleItem = (_e: MouseEvent<HTMLDivElement>) => {
        if (actionDisabled) {
            console.warn('You cannot use the other player\'s Board');
            return;
        }

        if (typeof checkHandler == 'function') {
            checkHandler(playerUUID, value);
        }
    };

    return(
        <div 
            className={`item ${classes}`} 
            onClick={handleItem}
            data-value={value}
            data-ship={shipName}
        />
    );
};
