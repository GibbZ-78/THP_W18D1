class Morpion {
	humanPlayer = 'J1';
	iaPlayer = 'J2';
    turn = 0;
	gameOver = false;

	gridMap = [
		[null, null, null],
		[null, null, null],
		[null, null, null],
	];

    // Adding useful vars to manage history (undo / redo)
    historyGrid = [];
    historyIndex = 0;

    // Adding an AI level switch
    morpionLevel = 1;

    constructor(firstPlayer = 'J1') {
		this.humanPlayer = firstPlayer;
		this.iaPlayer = (firstPlayer === 'J1') ? 'J2' : 'J1';
		this.initGame();
	}

	initGame = () => {

        // Instantiate the turns historization feature
        this.initHistory();

        // Instantiate the AI level button
        this.initLevel();

		this.gridMap.forEach((line, y) => {
			line.forEach((cell, x) => {
				this.getCell(x, y).onclick = () => {
					this.doPlayHuman(x, y);
				};
			});
		});

		if (this.iaPlayer === 'J1') {
			this.doPlayIa();
		}
	}

	getCell = (x, y) => {
		const column = x + 1;
		const lines = ['A', 'B', 'C'];
		const cellId = `${lines[y]}${column}`;
		return document.getElementById(cellId);
	}

    getBoardWinner = (board) => {
        const isWinningRow = ([a, b, c]) => (
            a !== null && a === b && b === c
        );

        let winner = null;

        // Horizontal
        board.forEach((line) => {
            if (isWinningRow(line)) {
                winner = line[0];
            }
        });

        // Vertical
        [0, 1, 2].forEach((col) => {
            if (isWinningRow([board[0][col], board[1][col], board[2][col]])) {
                winner = board[0][col];
            }
        });

        if (winner) {
            return winner;
        }

        // Diagonal
        const diagonal1 = [board[0][0], board[1][1], board[2][2]];
        const diagonal2 = [board[0][2], board[1][1], board[2][0]];
        if (isWinningRow(diagonal1) || isWinningRow(diagonal2)) {
            return board[1][1];
        }

        const isFull = board.every((line) => (
			line.every((cell) => cell !== null)
		));
        return isFull ? 'tie' : null;
    }

	checkWinner = (lastPlayer) => {
        const winner = this.getBoardWinner(this.gridMap);
        if (!winner) {
            return;
        }

        this.gameOver = true;
        switch(winner) {
            case 'tie':
			    this.displayEndMessage("Vous ??tes ?? ??galit?? !");
                break;
            case this.iaPlayer:
                this.displayEndMessage("L'IA a gagn?? !");
                break;
            case this.humanPlayer:
                this.displayEndMessage("Tu as battu l'IA !");
                break;
        }
	}

	displayEndMessage = (message) => {
		const endMessageElement = document.getElementById('end-message');
		endMessageElement.textContent = message;
		endMessageElement.style.display = 'block';
	}

	drawHit = (x, y, player) => {
		if (this.gridMap[y][x] !== null) {
			return false;
		}

		this.gridMap[y][x] = player;
        this.turn += 1;
		this.getCell(x, y).classList.add(`filled-${player}`);
		this.checkWinner(player);
		return true;
	}

	doPlayHuman = (x, y) => {
		if (this.gameOver) {
			return;
		}

        if (this.historyIndex !== this.turn) {
            console.log("  > Aligning turn on history");
            this.turn = this.historyIndex;
            console.log("  > Deleting 'forward history'");
            console.log(this.historyGrid);
            this.historyGrid = copyGrid(this.historyGrid.splice(this.historyIndex, 9999));
            console.log(this.historyGrid);
        }

		if (this.drawHit(x, y, this.humanPlayer)) {
            this.doHistorize();
			this.doPlayIa();
		}
	}

	doPlayIa = () => {
		if (this.gameOver) {
			return;
		}

        switch (this.morpionLevel) {
            case 3:
                const { x, y } = this.minmax(this.gridMap, 0, -Infinity, Infinity, true);
                console.log("  > Using MinMax AI");
                this.drawHit(x, y, this.iaPlayer);
                break;
            case 2:
                const { u, v } = () => {
                    this.gridMap.forEach((myLine, b) => {
                        myLine.forEach((myCell, a) => {
                            if (this.gridMap[b,a] === null) {
                                return {b,a};
                            }
                        });
                    });
                }
                console.log("  > Using 'first empty space' AI");
                this.drawHit(u, v, this.iaPlayer);
                break;
            default:
                
                console.log("  > Using 'random' AI");
                while (!this.drawHit(Math.floor(Math.random() * 3), Math.floor(Math.random() * 3), this.iaPlayer)) {
                    console.log("    - coordinates already taken...");
                };
                break;
        }
        
        
        this.doHistorize();
	}

    doHistorize = () => {
        this.historyGrid.push(this.copyGrid(this.gridMap));
        console.log("  > historyGrid");
        console.log(this.historyGrid);
        this.historyIndex += 1;
        console.log(`  > historyIndex = ${this.historyIndex}`);
        console.log(`  > turn = ${this.turn}`);
    }

    minmax = (board, depth, alpha, beta, isMaximizing) => {
        // Return a score when there is a winner
        const winner = this.getBoardWinner(board);
        if (winner === this.iaPlayer) {
            return 10 - depth;
        }
        if (winner === this.humanPlayer) {
            return depth - 10;
        }
        if (winner === 'tie' && this.turn === 9) {
            return 0;
        }

        const getSimulatedScore = (x, y, player) => {
            board[y][x] = player;
            this.turn += 1;

            const score = this.minmax(
                board,
                depth + 1,
                alpha,
                beta,
                player === this.humanPlayer
            );

            board[y][x] = null;
            this.turn -= 1;

            return score;
        };

        // This tree is going to test every move still possible in game
        // and suppose that the 2 players will always play there best move.
        // The IA search for its best move by testing every combinations,
        // and affects score to every node of the tree.
        if (isMaximizing) {
            // The higher is the score, the better is the move for the IA.
            let bestIaScore = -Infinity;
            let optimalMove;
            for (const y of [0, 1, 2]) {
                for (const x of [0, 1, 2]) {
                    if (board[y][x]) {
                        continue;
                    }

                    const score = getSimulatedScore(x, y, this.iaPlayer);
                    if (score > bestIaScore) {
                        bestIaScore = score;
                        optimalMove = { x, y };
                    }

                    // clear useless branch of the algorithm tree
                    // (optional but recommended)
                    alpha = Math.max(alpha, score);
                    if (beta <= alpha) {
                        break;
                    }
                }
            }

            return (depth === 0) ? optimalMove : bestIaScore;
        }

        // The lower is the score, the better is the move for the player.
        let bestHumanScore = Infinity;
        for (const y of [0, 1, 2]) {
            for (const x of [0, 1, 2]) {
                if (board[y][x]) {
                    continue;
                }

                const score = getSimulatedScore(x, y, this.humanPlayer);
                bestHumanScore = Math.min(bestHumanScore, score);

                // clear useless branch of the algorithm tree
                // (optional but recommended)
                beta = Math.min(beta, score);
                if (beta <= alpha) {
                    break;
                }
            }
        }

        return bestHumanScore;
    }

    refreshGrid = () => {
        for (const y of [0, 1, 2]) {
            for (const x of [0, 1, 2]) {
                if (this.gridMap[y][x]) {
                    this.getCell(x, y).classList.add(`filled-${this.gridMap[y][x]}`);
                } else {
                    this.getCell(x, y).classList.remove(`filled-J1`,`filled-J2`);
                }
            }
        }
        console.log(`  > historyIndex = ${this.historyIndex}`);
        console.log(`  > turn = ${this.turn}`);
        document.getElementById("undoButton").ariaDisabled = this.historyIndex <= 0;
        document.getElementById("redoButton").ariaDisabled = this.historyIndex >= this.turn;
        this.historyIndex <= 0 ? document.getElementById("undoButton").classList.add("disabled") : document.getElementById("undoButton").classList.remove("disabled");
        this.historyIndex >= this.turn ? document.getElementById("redoButton").classList.add("disabled") : document.getElementById("redoButton").classList.remove("disabled");
    };

    copyGrid = (myGrid) => {
        return JSON.parse(JSON.stringify(myGrid));
    }

    initHistory = () => {
        this.historyGrid.push(this.copyGrid(this.gridMap));
        console.log("*** Initializing history feature ***");
        console.log("  > gridMap");
        console.log(this.gridMap);
        console.log("  > historyGrid");
        console.log(this.historyGrid);
        
        document.getElementById("undoButton").onclick = (event) => {
            event.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex -= 1;
                console.log(`Back to turn ${this.historyIndex} / ${this.turn}`);
                this.gridMap = this.copyGrid(this.historyGrid[this.historyIndex]);
                console.log("  > gridMap");
                console.log(this.gridMap);
                console.log("  > historyGrid");
                console.log(this.historyGrid);
                document.getElementById('end-message').style.display = 'none';
                this.refreshGrid();
            } else {
                console.log("Undo NOT POSSIBLE");
            }
        };
        
        document.getElementById("redoButton").onclick = (event) => {
            event.preventDefault();
            if (this.historyIndex < this.turn) {
                this.historyIndex += 1;
                console.log(`Forward to turn ${this.historyIndex} / ${this.turn}`);
                this.gridMap = this.copyGrid(this.historyGrid[this.historyIndex]);
                console.log("  > gridMap");
                console.table(this.gridMap);
                console.log("  > historyGrid");
                console.table(this.historyGrid);
                this.refreshGrid();
            } else {
                console.log("Redo NOT POSSIBLE");
            }
        };
    };

    initLevel = () => {
        document.getElementById("levelButton").textContent = `Current AI level: ${this.morpionLevel}`;
        document.getElementById("levelButton").onclick = (event) => {
            event.preventDefault();
            switch (this.morpionLevel) {
                case 1:
                case 2:
                    this.morpionLevel++;
                    break;
                default:
                    this.morpionLevel = 1;
                    break;
            }
            event.target.textContent = `Current AI level: ${this.morpionLevel}`;
        }
    };
}


// Main pgrogram
const myMorpion = new Morpion();