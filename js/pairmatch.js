
function createPairMatch(x, y, table) {
    let alg = createAlgebra({
        //elems: ["a", "b", "c", "0"],
        identity: "0",
        table,
    });

    console.log("XX", alg.elems);
    let elemSprites = 
        mapElemSprites(alg.elems, 
                ["coin_gold", 
                 "coin_silver",
                 "coin_copper"],
                 sprite => {
                     sprite.animations.add("rotate");
                     sprite.frame = Math.floor(9*Math.random());
                     sprite.animations.play("rotate", 9, true);
                 });

    let board = createBoard(8, 5, 
            {
                cellalpha: 0.7,
                cellsize: 70, 
                cellspc: 5,
                bgname: "fire",
                cellname: "metal",
            });
    board.setBoardPosition(x, y);
    board.table = table;
    board.elemSprites = elemSprites;

    //-----------------------------
    // random creation

    let wah = (alg, elemSprites, cellsize) => {
        let table = alg.table;
        let rows = table.length;
        let cols = 0;
        table.forEach(row => {
            if (row.length > cols)
                cols = row.length;
        });
        cols++;

        let board = createBoard(rows, cols,
                {
                    cellalpha: 0.1,
                    cellsize: cellsize,
                    cellspc: 5,
                    bgname: "toxic",
                    cellname: "metal",
                });

        table.forEach((row, i) => {
            for (let j = cols-row.length; j < cols; j++) {
                let elem = row[j];
                let sprite = elemSprites.createSprite(elem);
                board.set(sprite, i, j);
            }
        });

        board.setBoardPosition(100, 100);
        return board;
    }

    //-----------------------------

    let combining = false;
    let startPos = {};
    let endPos = {};

    let startCombining = (i, j) => {
        combining = true;
        board.select({i, j});
    }
    let stopCombining = () => {
        combining = false;
        board.deselectCells();
        startPos = {};
        endPos = {};
    }

    board.onCellTap = () => {};

    board.onCellDragUpdate = (i, j) => {
        endPos = {i, j};
    }
    board.onCellDragStart = (i, j) => {
        if (combining)
            return true;
        startCombining(i, j);
        startPos = {i, j};
    };
    board.onCellDragStop = () => {
        if (!combining)
            false;

        let v = board.subpos(endPos, startPos);
        v = board.normalizepos(v);

        if ((v.i == 0 && v.j == 0) ||
            (v.i != 0 && v.j != 0)) { // disallow diagonals
            stopCombining();
            return;
        }

        let pos = board.addpos(startPos, v);

        let srcSprite = board.get(startPos.i, startPos.j);
        let dstSprite = board.get(pos.i, pos.j);

        if (!srcSprite || !dstSprite) {
            stopCombining();
            return;
        }

        let a = elemSprites.elemName(srcSprite.key);
        let b = elemSprites.elemName(dstSprite.key);
        let c = alg.apply(a, b);

        // sick DSL dude /s?
        // nice memleak bruh /s....?
        sequence(
            x=> board.moveTo(srcSprite, pos.i, pos.j),
            x=> {
                if (c == null) {
                    return sequence(
                        x=> board.moveTo(srcSprite, startPos.i, startPos.j),
                        x=> board.set(dstSprite, pos.i, pos.j),
                        x=> stopCombining(),
                    );
                }
                return sequence(
                        x=> parallel(
                            x=> tweener(srcSprite, {alpha: 0}, 500),
                            x=> tweener(dstSprite, {alpha: 0}, 500),
                            _=> {
                                let {i, j} = srcSprite.gridpos;
                                let {x, y} = board.centerPos(i, j);
                                let emitter = game.add.emitter(x, y, 30);
                                emitter.makeParticles(["star"]);
                                emitter.start(false, 500, 120, 7);
                            }
                        ),
                        x=> {
                            srcSprite.destroy();
                            dstSprite.destroy();
                            stopCombining();

                            board.detach(pos.i, pos.j);
                            if (alg.identity == c) {
                                return;
                            }

                            let newsprite = elemSprites.createSprite(c);
                            newsprite.alpha = 0;

                            board.set(newsprite, pos.i, pos.j);

                            sequence(
                                x=> tweener(newsprite, {alpha: 1}, 500),
                                //x=> stopCombining(),
                            ).start();
                        },
                );
            },
        ).start();
    };

    board.start = () => {
        for (let i = 0; i < board.rows; i++) {
            for (let j = 0; j < board.cols; j++) {
                let idx = Math.floor(Math.random() * alg.elems.length);
                let elem = alg.elems[idx];
                if (elem == alg.identity)
                    continue;
                let sprite = elemSprites.createSprite(elem);
                board.set(sprite, i, j);
            }
        }
        board.exists = true;
    }

    board.stop = () => {
        board.clear();
        board.exists = false;
    }

    return board;
}

