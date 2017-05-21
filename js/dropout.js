
function createDropout(startX, startY, table=[]) {
    let alg = createAlgebra({
        identity: "0",
        table,
    });

    let playing = false;

    let elemSprites = 
        mapElemSprites(alg.elems, 
                [
                    charname("M", ""+Math.floor(1+Math.random()*11)),
                    charname("F", ""+Math.floor(1+Math.random()*11)),
                    charname("M", ""+Math.floor(1+Math.random()*11)),
                    charname("F", ""+Math.floor(1+Math.random()*11)),
                 ],
                 sprite => {
                     //sprite.animations.add("rotate");
                     //sprite.frame = Math.floor(9*Math.random());
                     //sprite.animations.play("rotate", 9, true);
                 });

    let board = createBoard(18, 10, 
            {
                //boardX: 50, 
                //boardY: 50, 
                cellalpha: 0.1,
                cellsize: 35, 
                cellspc: 2,
                bgname: "starfield",
                cellname: "block",
            });
    board.setBoardPosition(startX, startY);
    board.table = table;
    board.elemSprites = elemSprites;

    let mappingTable = createAlgebraTable(
        board.getX()+board.width,
        board.getY(), 
        board.table, board.elemSprites);


    board.onCellDragStart = (i, j) => {
        console.log(i, j, board.get(i, j)!=null);
    }

    let shapes = [
        {
            pivot: [0, 1],
            poss:
            ["****"],
        },

        {
            pivot: [0, 1],
            poss:
            ["***",
             " * "],
        },

        {
            pivot: [0, 1],
            poss:
            ["***",
             "  *"],
        },

        {
            pivot: [0, 1],
            poss:
            ["**",
             "**"],
            // custom rotation
            rotateFn: spriteGroup => {
                let poss = spriteGroup.map(s => s.gridpos);
                let x = poss.shift();
                poss.push(x);
                return poss;
            }
        },

    ];
    let createShapeGroup = (i, j) => {
        let sprites = [];
        let shape = util.randomSelect(shapes);

        shape.poss.forEach((str, n) => {
            let row = str.split("");
            row.forEach((x, m) => {
                if (x != " ") {
                    let elem = alg.identity;
                    for (let i = 0; i < 10000 && elem == alg.identity; i++) {
                        let idx = Math.floor(Math.random() * alg.elems.length);
                        elem = alg.elems[idx];
                    }

                    let sprite = elemSprites.createSprite(elem);
                    if (shape.pivot[0] == n && shape.pivot[1] == m) 
                        sprites.unshift([
                            sprite,
                            i+n, j+m
                        ]);
                    else
                        sprites.push([
                            sprite,
                            i+n, j+m
                        ]);
                }
            });
        });
        let group = board.createSpriteGroup(sprites);
        group.noRotate = shape.noRotate;
        group.rotateFn = shape.rotateFn;
        return group;
    }

    // TODO: group several operations into one
    
    let savedAction;
    let dropping = false;
    let isMoving = false;
    let currentShapeGroup = [];

    let perform = (action, push=false) => {
        if (isMoving) {
            if (push)
                savedAction = action;
            return;
        }
        sequence(
            x=> {  isMoving = true; },
            x=> action,
            x=> savedAction,
            x=> savedAction = null,
            x=> {  
                isMoving = false; 
            },
        ).start();
    }

    let findCombinations = (spriteGroup) => {
        for (let sprite of spriteGroup) {
            if (!sprite.gridpos)
                continue;
            let {i, j} = sprite.gridpos;
            for (let size of alg.arglens) {
                // TODO: search is not exhaustive
                // ******************
                // ******************
                // ******************
                // ******************
                // ******o***********
                // ***xxxoo**********
                let regions = board.getCrossRegion(i, j, size);
                for (let argSprites of regions) {
                    let elems = 
                        argSprites.map(s => elemSprites.elemName(s.key));

                    let z = alg.apply(...elems);
                    if (z != null) {
                        return [z, argSprites]
                    }
                }
            }
        };
        return [];
    }

    let drop = () => {
        let xxx = currentShapeGroup;
        let result;
        return sequence(
                x=> dropping = true,

                x=> doWhile( () => result != null,
                    x=> board.disintegrate(xxx),
                    x=> {
                        let [z, argSprites] = findCombinations(xxx);
                        result = z;

                        // TODO: insert Z value
                        
                        if (z != null) {
                            let spritesAffected = 
                                board.getAffectedRegions(argSprites).concat(xxx);
                            //board.deselectCells();
                            let [min, max] = board.getPosRange(spritesAffected);
                            //let poss = board.getCellRegion(min, max);
                            //board.select(...poss);

                            let tweens = argSprites.map(s => {
                                let {i, j} = s.gridpos;
                                let {x, y} = board.centerPos(i, j);
                                let emitter = game.add.emitter(
                                        x, 
                                        y, 10);
                                emitter.makeParticles(["star"]);
                                emitter.start(false, 500, 120, 2);
                                // TODO: reuse emitters
                                return x=>tweener(s, {alpha: 0}, 500)
                            });
                            return sequence(
                                    x=> wait(1000),
                                    x=> parallel(...tweens),
                                    x=> {
                                        let {i, j} = argSprites[0].gridpos;
                                        argSprites.forEach(s => {
                                            let {i, j} = s.gridpos;
                                            board.detach(i, j);
                                            s.destroy();
                                        });
                                        if (z != alg.identity) {
                                            let sprite = elemSprites.createSprite(z);
                                            board.set(sprite, i, j);
                                            sprite.alpha = 0;
                                            return tweener(sprite, {alpha: 1}, 800);
                                        }
                                    },
                                    x=> {
                                        //board.select(...poss);
                                        xxx = board.createGroupRegion(min, max); 
                                        //return board.disintegrate(region);
                                    },
                            );
                        }
                    }
                ), 
                x=> {
                    currentShapeGroup = createShapeGroup(2, board.cols/2-1);
                    let v = board.gravity;
                    let poss = currentShapeGroup.map(s => board.addpos(s.gridpos, v));
                    if (board.hasCollision(currentShapeGroup, poss)) {
                        console.log("game over");
                        playing = false;
                        if (board.onGameOver)
                            board.onGameOver();
                    } else {
                        dropping = false;
                    }
                },
        );
    }

    let descendShape = () => {
        if (!playing)
            return;

        let pos = currentShapeGroup[0].gridpos;
        let action = sequence(
            x=> board.moveGroupBy(currentShapeGroup, 1, 0),
            x=> {
                let pos_ = currentShapeGroup[0].gridpos;

                if (!pos || !(pos.i == pos_.i && pos.j == pos_.j))
                    return;

                return drop();
            }
        );
        perform(action, true);
    }

    inputHandler = (cursor) => {
        if (dropping)
            return;

        if (!playing)
            return;

        if (cursors.up.isDown && !currentShapeGroup.noRotate) {
            let rotateFn = currentShapeGroup.rotateFn;
            perform(board.rotateGroup(currentShapeGroup, false, rotateFn));
        } else if (cursors.left.isDown) {
            perform(board.moveGroupBy(currentShapeGroup, 0, -1));
        } else if (cursors.right.isDown) {
            perform(board.moveGroupBy(currentShapeGroup, 0,  1));
        } else if (cursors.down.isDown) {
            perform(drop());
        }
    }


    // haha, there's no better way of improving my debugging
    // skills than fixing my own shitty code
    descendShape();
    game.time.events.loop(3 * Phaser.Timer.SECOND, descendShape, this);

    //-----------------------------
    // random creation

    //for (let j = 0; j < board.cols; j++) {
    //    let rows = board.rows - Math.floor(Math.random() * 7);
    //    for (let i = board.rows-1; i > rows; i--) {
    //        let idx = Math.floor(Math.random() * alg.elems.length);
    //        let elem = alg.elems[idx];
    //        if (elem == alg.identity) {
    //            i++;
    //            continue;
    //        }
    //        let sprite = elemSprites.createSprite(elem);
    //        board.set(sprite, i, j);
    //    }
    //}
    
    let initRow = board.rows-4;
    let initializeLevel = () => {
        for (let i = initRow; i < board.rows; i++) {
            for (let j = 0; j < board.cols; j++) {
                let idx = Math.floor(Math.random() * alg.elems.length);
                let elem = alg.elems[idx];
                if (elem == alg.identity)
                    continue;
                let sprite = elemSprites.createSprite(elem);
                board.set(sprite, i, j);
            }
        }
        let initRegion = 
            board.createGroupRegion({i: initRow, j: 0}, {i: board.rows-1, j: board.cols-1});

        board.disintegrate(initRegion).start();
        currentShapeGroup = createShapeGroup(2, board.cols/2-1)
    }

    //let initRegion = 
    //    board.createGroupRegion({i: initRow, j: 0}, {i: board.rows-1, j: board.cols-1});
    //sequence(
    //    x=> board.disintegrate(initRegion),
    //    //x=> board.disintegrate(initRegion, 0, -1),
    //).start();


    //let r = 1;
    //let x = 5;
    //for (let n = 7; n <= 14; n++) {
    //    let y = x;
    //    for (let m = 0; m < y*2-1; m++) {
    //        let i = n;
    //        let j = r+m;
    //        let idx = Math.floor(Math.random() * alg.elems.length);
    //        let elem = alg.elems[idx];
    //        let sprite = elemSprites.createSprite(elem);
    //        if (elem == alg.identity) {
    //            m--;
    //            continue;
    //        }
    //        board.set(sprite, i, j);
    //    }
    //    r++;
    //    x--;
    //}

    let startPos = {};
    let endPos = {};

    board.onCellTap = (i, j) => {
        //let sprite = board.get(i, j);
        //if (sprite)
        //    alert(elemSprites.elemName(sprite.key) + ` ${i} ${j}`);
        //else
        //    alert(false, ` ${i} ${j}`);
    };

    board.start = (state) => {
        mappingTable.start();

        board.exists = true;
        playing = true;
        savedAction = null;
        dropping = false;
        isMoving = false;
        currentShapeGroup = [];
        initializeLevel();
    }
    board.stop = (state) => {
        mappingTable.stop();

        playing = false;
        currentShapeGroup.forEach(s => s.destroy());
        currentShapeGroup = [];
        board.clear();
        board.exists = false;
    }
    board.stop();

    return board;
}

