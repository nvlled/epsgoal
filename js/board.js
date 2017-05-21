"use strict";

function createBoard(
        rows, cols, 
        { cellsize=90, cellspc=10, 
          bgname="sky", cellname="cell",
          boardX=0, boardY=0,
          cellbgtint=0x00fe00,
          celltint=0xff9999,
          cellalpha=1,
          hasEdges=true,
        } = {}) {
    console.log("boardY", boardY);

    let board, boardEdges;

    let edgeThick = 0.1;
    //let boardWidth = 300;
    //let boardHeight = 400;

    let boardWidth = (cellsize + cellspc) * cols + cellspc;
    let boardHeight = (cellsize + cellspc) * rows + cellspc;

    board = game.add.group();
    board.enableBody = true;
    //board.exists = false;

    //-----------------------
    boardEdges = game.add.group(board);
    boardEdges.enableBody = true;
    let edge = boardEdges.create(0, 0, "ground");
    edge.body.immovable = true;
    edge.width = boardWidth;
    edge.height = edgeThick;

    edge = boardEdges.create(0, 0, "ground");
    edge.body.immovable = true;
    edge.width = edgeThick;
    edge.height = boardHeight;

    edge = boardEdges.create(boardWidth, 0, "ground");
    edge.body.immovable = true;
    edge.width = edgeThick;
    edge.height = boardHeight;

    edge = boardEdges.create(0, boardHeight, "ground");
    edge.body.immovable = true;
    edge.width = boardWidth;
    edge.height = edgeThick;

    //------------------

    let boardbg = board.create(0, 0, bgname);
    board.position.setTo(boardX, boardY);
    boardbg.width = boardWidth;
    boardbg.height = boardHeight;

    let toXY = (i, j) => {
        let x = cellspc + j * (cellsize + cellspc); 
        let y = cellspc + i * (cellsize + cellspc);
        return {x, y};
    }

    let toRC = (x, y) => {
        let  i = (y - cellspc)/(cellsize + cellspc); 
        let  j = (x - cellspc)/(cellsize + cellspc); 
        return {i, j};
    }

    let module;

    let cells = game.add.group(board);
    let cellItems = game.add.group(board);

    cells.inputEnabled = false;
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            let v = toXY(i, j);
            let cell = cells.create(v.x, v.y, cellname);
            let dragging = false;

            cell.alpha = cellalpha;
            cell.inputEnabled = true;
            cell.events.onInputUp.add(s=> {
                if (typeof module.onCellTap == "function") {
                    let pos = module.dragStopPos;
                    if (pos && pos.i == i && pos.j == j) {
                        //console.log("input up");
                        module.onCellTap(i, j);
                    }
                }
            });

            cell.input.enableDrag(false, false, false, 255,
                    new Phaser.Rectangle(v.x, v.y, cellsize, cellsize));
            //cell.input.enableSnap(cellsize+cellspc, cellsize+cellspc, true, false, boardX+cellspc, boardY+cellspc);

            cell.events.onDragStart.add(e => {
                //console.log("drag start");
                // update actually gets called before start......
                if (typeof module.onCellDragStart == "function") {
                    let cancel = module.onCellDragStart(i, j);
                    if (!cancel) {
                        module.dragStartPos = {i, j};
                        dragging = true;
                    }
                }
            });
            cell.events.onDragStop.add(e => {
                if (!dragging)
                    return;

                if (typeof module.onCellDragStop == "function")
                    module.onCellDragStop()
                dragging = false;
            });

            cell.events.onDragUpdate.add((rec, sen, x, y) => {
                if (!module.dragStartPos || !dragging)
                    return;
                //console.log("drag update");
                let j = Math.floor((x-boardX+cellspc)/(cellsize+cellspc));
                let i = Math.floor((y-boardY+cellspc)/(cellsize+cellspc));

                module.dragStopPos = {i, j};

                //if (i < 0 || j < 0) {
                //    return;
                //}

                if (typeof module.onCellDragUpdate == "function")
                    module.onCellDragUpdate(i, j)
            });


            cell.width = cellsize;
            cell.height = cellsize;
        }
    }


    let items = [];
    let getIndex = (i, j) => {
        if (i < 0 || i >= rows || j < 0 || j >= cols)
            return -1;
        //    throw `i=${i} is out of range`;
        //if ()
        //    throw `j=${j} is out of range`;

        return i*cols + j;
    }
    let fromIndex = index => {
        return {
            i: Math.floor(index/cols), 
            j: Math.floor(index%cols), 
        }
    };

    module = {
        selectedCells: new Set(),
        phaserGroups: { board, boardEdges, cells, cellItems},

        cellsize,
        rows,
        cols,
        items,
        toXY,
        edges: boardEdges,

        getX() { return board.position.x },
        getY() { return board.position.y },

        centerPos(i, j) {
            let {x, y} = toXY(i, j);
            return { x: this.getX()+ x + cellsize/2,
                     y: this.getY()+ y + cellsize/2 };
        },

        clear() {
            items = [];
            cellItems.removeAll(true);
        },

        start() { },
        stop() { },

        width: boardWidth,
        height: boardHeight,

        setBoardPosition(x, y) {
            board.position.set(x, y);
        },

        gravity: {i: 1, j: 0}, 

        getIndex: getIndex,

        onCellTap(i, j) {
            this.deselectCells();
            this.select({i, j});
        },

        dragStartPos: null,
        dragStopPos: null,

        onCellDragStart(i, j) { 
            this.deselectCells();
            this.select({i, j}); 
            //this.dragStartPos = {i, j};
        },
        onCellDragUpdate(i, j) { 
            if (!this.dragStartPos)
                return;
            this.deselectCells();
            let cells = this.getCellRegion(this.dragStartPos, {i, j});
            this.dragStopPos = {i, j};
            this.select(...cells);
        },

        onCellDragStop() {
            //this.dragStopPos = {i, j};
        },

        // TODO:  create default handlers
        // onCellDragStart
        // onCellDragUpdate
        // onCellDragEnd

        getIndexSet(spriteGroup) {
            let set = new Set();
            spriteGroup.forEach(s => {
                let pos = s.gridpos;
                set.add(getIndex(pos.i, pos.j))
            });
            return set;
        },

        isOccupied(indexSet, i, j) {
            let index = this.getIndex(i, j);
            let containsPos = indexSet.has(index);
            return !containsPos && this.get(i, j);
        },

        get(i, j) {
            try {
                return items[getIndex(i, j)];
            } catch (e) {
                return null;
            }
        },

        deselectCells() {
            this.selectedCells.forEach(index => {
                let {i, j} = fromIndex(index);
                this.highlightCell(i, j, true);
            });
            this.selectedCells.clear();
        },

        select(...poss) {
            this.selectedCells.clear();
            poss.forEach(({i, j}) => {
                this.selectedCells.add(getIndex(i, j));
                this.highlightCell(i, j);
            });
        },

        highlightCell(i, j, clear=false) {
            let sprite = this.get(i, j);
            if (sprite) {
                sprite.tint = clear ? 0xffffff : celltint;
            }
            //cells.getChildAt(getIndex(i, j)).tint = clear ? 0xffffff : cellbgtint;
            sprite = items[getIndex(i, j)];
            if (sprite)
                sprite.tint = clear ? 0xffffff : cellbgtint;
        },

        detach(i, j) {
            let sprite = items[getIndex(i, j)];
            if (sprite)
                sprite.gridpos =  null;
            items[getIndex(i, j)] = null;
        },

        remove(i, j) {
            let index = getIndex(i, j);
            let s = items[index];
            if (s) {
                items[index] = null;
            }
        },

        set(sprite, i, j) {
            if (this.get(i, j) != null && sprite != this.get(i, j)) {
                console.warn(`sprite is being replaced in cell (${i}, ${j})`);
            }

            if (!sprite.gridpos)
                cellItems.add(sprite);
            else
                this.remove(sprite.gridpos.i, sprite.gridpos.j);

            sprite.gridpos = {i, j};
            sprite.width = cellsize;
            sprite.height = cellsize;

            let v = toXY(i, j);
            sprite.x = v.x;
            sprite.y = v.y;
            items[getIndex(i, j)] = sprite;
        },

        // nice job not using Point
        normalizepos(pos) {
            let {i, j} = pos;
            let len = Math.sqrt(i*i + j*j);
            if (len == 0)
                return pos;
            return {i: Math.floor(i/len), j: Math.floor(j/len)};
        },

        addpos(pos1, pos2) {
            return {
                i: pos1.i+pos2.i,
                j: pos1.j+pos2.j,
            }
        },

        subpos(pos1, pos2) {
            return {
                i: pos1.i-pos2.i,
                j: pos1.j-pos2.j,
            }
        },

        mulpos(pos1, pos2) {
            return {
                i: pos1.i*pos2.i,
                j: pos1.j*pos2.j,
            }
        },

        scalepos(pos, n) {
            return {
                i: pos.i*n,
                j: pos.j*n,
            }
        },

        sumpos(pos) {
            return pos.i + pos.j;
        },

        rotatepos(pos, isReverse) {
            if (isReverse) {
                return {
                    i: pos.j,
                    j: -pos.i,
                }
            }
            return {
                i: -pos.j,
                j: pos.i,
            }
        },

        moveTo(sprite, i, j) {
            if (!sprite.gridpos) {
                console.log("**sprite is not added in the grid");
                return;
            } 

            var tween = game.add.tween(sprite).to(toXY(i, j), 500, 
                                       Phaser.Easing.Quadratic.InOut);

            let ctrl;
            tween.onComplete.add(() => {
                //let pos = sprite.gridpos;
                this.set(sprite, i, j);
                if (ctrl.done)
                    ctrl.done();
            });
            ctrl = {
                start: _=>tween.start(),
                stop:  _=>tween.stop(),
            }
            return ctrl;
        },

        moveBy(sprite, di, dj) {
            let v = {i: di, j: dj};
            let {i, j} = this.addpos(sprite.gridpos, v);
            return this.moveTo(sprite, i, j);
        },

        getCrossRegion(i, j, size) {
            if (this.get(i, j) == null)
                return [];

            let dirs = [[0, 1], [0, -1], [1, 0], [1, 0]];
            return dirs.map(([di, dj]) => {
                let d = {i: di, j: dj};
                let v = this.scalepos(d, size-1);
                let p1 = {i, j};
                let p2 = this.addpos(p1, v);
                let region = this.createGroupRegion(p1, p2);
                return region;
            }).filter(r => r.length == size);
        },

        getAffectedRegions(spriteGroup, di, dj) {
            if (di == null && dj == null) {
                di = this.gravity.i;
                dj = this.gravity.j;
            }
            let sprites = [];
            spriteGroup.forEach(s => {
                let pos = s.gridpos;
                let v = {i:di, j:dj};
                let w = this.scalepos(v, -1);

                let n = 1;
                while (true) {
                    let p1 = this.addpos(pos, this.scalepos(v, n));
                    let p2 = this.addpos(pos, this.scalepos(w, n));

                    let s1 = this.get(p1.i, p1.j);
                    let s2 = this.get(p2.i, p2.j);

                    // !!!!!!!!!!
                    // !!!!!!!!!!
                    // !!!!!!!!!!
                    // !!!!!!!!!!
                    // this probably breaks something
                    if (s1)
                        sprites.push(s1);
                    if (s2)
                        sprites.push(s2);
                    if (!s1 && !s2)
                        break;

                    n++;
                }
            });
            return sprites;
        },

        getUniqueSprites(sprites) {
            let set = {};
            sprites.forEach(s => {
                if (!s)
                    return;
                let {i, j} = s.gridpos;
                set[getIndex(i, j)] = s;
            });
            return Object.values(set);
        },

        getPosRange(sprites) {
            let mini = rows, minj = cols;
            let maxi = 0, maxj = 0;
            sprites.forEach(s => {
                let {i, j} = s.gridpos;
                [mini, minj] = [Math.min(i, mini), Math.min(j, minj)];
                [maxi, maxj] = [Math.max(i, maxi), Math.max(j, maxj)];
            });
            return [
                 {i: mini, j: minj},
                 {i: maxi, j: maxj},
            ]
        },

        moveGroupTo(spriteGroup, i, j) {
            let pivotSprite = spriteGroup[0];
            //let pos = pivotSprite.gridpos;
            let v = this.subpos({i, j}, pivotSprite.gridpos); 

            // TODO: avoid sorting here
            let wah = spriteGroup.slice().sort((a, b) => {
                let v = {i, j};
                let n = this.sumpos(this.mulpos(a.gridpos, v));
                let m = this.sumpos(this.mulpos(b.gridpos, v));
                return n < m
            });

            let tweens = wah.map(sprite => {
                let pos = sprite.gridpos;
                // using the names (i,j) is a bad idea....
                return x=> this.moveTo(sprite, pos.i+v.i, pos.j+v.j);
            });
            return parallel(...tweens);
        },

        isOutbounds(i, j) {
            return i < 0 || i >= rows
                || j < 0 || j >= cols;
        },

        // groups spriteGroup by columns
        partition(spriteGroup, di, dj) {
            let v = this.rotatepos({i: di, j: dj});
            v.i = Math.abs(v.i);
            v.j = Math.abs(v.j);

            let subgroups = [];
            spriteGroup.forEach(s => {
                if (!s.gridpos)
                    return;
                let huh = this.sumpos(this.mulpos(v, s.gridpos));
                if (!subgroups[huh]) {
                    subgroups[huh] = [];
                }
                subgroups[huh].push(s);
            });
            return subgroups;
        },

        disintegrate(spriteGroup, di, dj) {
            if (di == null && dj == null) {
                di = this.gravity.i;
                dj = this.gravity.j;
            }

            let tweens = this.partition(spriteGroup, di, dj).map(group => {

                // fill in empty row spaces
                group = group.sort((s1, s2) => s1.gridpos.i > s2.gridpos.i);

                let n = 0;
                while (n < group.length-1) {
                    let first = group[n];
                    let next = group[n+1];
                    let {i, j} = first.gridpos;
                    this.set(next, i+1, j);
                    n++;
                }

                return ()=>this.dropGroup(group, di, dj);
            });

            // TODO: clear spriteGroup?
            
            return parallel(...tweens);
        },

        createSpriteGroup(sprites) {
            return sprites.map(s => {
                let sprite;
                if (typeof s[0] == "string")
                    sprite = game.add.sprite(0, 0, s[0]);
                else
                    sprite = s[0];
                this.set(sprite, s[1], s[2]);
                return sprite;
            });
        },

        getCellRegion(pos1, pos2) {
            let starti = Math.min(pos1.i, pos2.i);
            let endi = Math.max(pos1.i, pos2.i);
            let startj = Math.min(pos1.j, pos2.j);
            let endj = Math.max(pos1.j, pos2.j);
            let cells = [];
            for (let i = starti; i <= endi; i++) {
                for (let j = startj; j <= endj; j++) {
                    cells.push({i, j});
                }
            }
            return cells;
        },
        
        createGroupRegion(pos1, pos2) {
            // TODO: use getCellRegion
            let group = [];
            for (let i = pos1.i; i <= pos2.i; i++) {
                for (let j = pos1.j; j <= pos2.j; j++) {
                    let sprite = this.get(i, j);
                    if (sprite) {
                        group.push(sprite);
                    }
                }
            }
            return group;
        },

        hasCollision (spriteGroup, poss) {
            let indexSet = this.getIndexSet(spriteGroup);
            for (let n = 0; n < poss.length; n++) {
                let pos = poss[n];

                // check sprite is not in poss
                let sprite = this.get(pos.i, pos.j);

                if (this.isOutbounds(pos.i, pos.j) ||
                        this.isOccupied(indexSet, pos.i, pos.j)) 
                        
                    return true;
            }
            return false;
        },

        dropGroup(spriteGroup, i, j) {
            if (i == null && j == null) {
                i = this.gravity.i;
                j = this.gravity.j;
            }

            let indexSet = this.getIndexSet(spriteGroup);
            let poss = spriteGroup.map(s => {
                let pos = s.gridpos;
                return pos;
            });

            let v = {i, j};

            let bounds = 10000;
            while (true) {
                let poss_ = poss.map(p => this.addpos(p, v));
                if (this.hasCollision(spriteGroup, poss_))
                    break;

                if (bounds-- <= 0) {
                    console.log("it's bwoke...");
                    break;
                }
                poss = poss_;
            }

            // TODO: 
            //sequence(
            //    x=> loop(
            //        () => true,
            //        () => {
            //        }
            //    ),
            //    x=> 
            //);

            let tgtpos = poss[0];
            return this.moveGroupTo(spriteGroup, tgtpos.i, tgtpos.j);

        },

        moveGroupBy(spriteGroup, di, dj) {
            let v = {i: di, j: dj};
            let {i, j} = this.addpos(spriteGroup[0].gridpos, v);

            let poss = spriteGroup.map(s => {
                let pos = this.addpos(s.gridpos, v);
                return pos;
            });

            if (this.hasCollision(spriteGroup, poss))
                return;

            return this.moveGroupTo(spriteGroup, i, j);
        },


        rotateGroup(spriteGroup, isReverse, rotateFn) {
            if (spriteGroup.noRotate)
                return;

            let pivotSprite = spriteGroup[0];

            let indexSet = this.getIndexSet(spriteGroup);

            let cancel = false;
            let newposs;

            if (rotateFn) {
                newposs = rotateFn(spriteGroup);
                // !!!
                // TODO: check if outbounds
            } else {
                newposs = spriteGroup.map(sprite => {
                    let pos = sprite.gridpos;
                    let add = this.addpos;
                    let sub = this.subpos;
                    let rot = this.rotatepos;

                    let pivotpos = pivotSprite.gridpos;
                    let newpos = add(pivotpos, rot(sub(pos, pivotpos), isReverse));

                    if (this.isOutbounds(newpos.i, newpos.j) || 
                            this.isOccupied(indexSet, newpos.i, newpos.j)) {
                        cancel = true;
                    }

                    return newpos;
                });
            }

            if (cancel) {
                return { }
            }

            let tweens = spriteGroup.map((sprite, index) => {
                let pos = sprite.gridpos;

                if (pos == null) {
                    console.log("**sprite is not added in the grid");
                    return;
                }

                //let add = this.addpos;
                //let sub = this.subpos;
                //let rot = this.rotatepos;
                //let pivotpos = pivotSprite.gridpos;
                //let newpos = add(pivotpos, rot(sub(pos, pivotpos)));

                let newpos = newposs[index];
                return ()=>this.moveTo(sprite, newpos.i, newpos.j);
            });
            return parallel(...tweens);
        },

        //dropTo(sprite, di, dj, collide=false) {
        //    if (!sprite.gridpos) {
        //        console.log("**sprite is not added in the grid");
        //        return;
        //    } 

        //    let clamp = Phaser.Math.clamp;
        //    let easing = Phaser.Easing.Power0;
        //    let tween = game.add.tween(sprite);

        //    let {i, j} = sprite.gridpos;
        //    let ni = clamp(i+di, 0, rows-1);
        //    let nj = clamp(j+dj, 0, cols-1);

        //    let speed = 10;
        //    tween.to(toXY(ni, nj), speed, easing);

        //    let onComplete, ctrl;
        //    onComplete = () => {
        //        items[getIndex(i, j)] = null;
        //        [i, j] = [ni, nj];
        //        this.set(sprite, i, j);

        //        ni = clamp(i+di, 0, rows-1);
        //        nj = clamp(j+dj, 0, cols-1);

        //        let finish = () => {
        //            tween.stop();
        //            if (typeof ctrl.done === "function") {
        //                ctrl.done();
        //            }
        //        }

        //        if (ni == i && j == nj) {
        //            finish();
        //            return;
        //        }

        //        let isObstructed = collide && this.get(ni, nj) != null;

        //        if (!isObstructed &&
        //                (di != 0 && ni >= 0 && ni <= rows-1) || 
        //                (dj != 0 && nj >= 0 && nj <= cols-1)
        //            ) {
        //            tween.stop();
        //            tween = game.add.tween(sprite);
        //            tween.to(toXY(ni, nj), speed, easing);
        //            tween.onComplete.add(onComplete);
        //            tween.start();
        //        } else {
        //            finish();
        //        }
        //    }
        //    tween.onComplete.add(onComplete);
        //    ctrl = {
        //        start: () => tween.start(),
        //        stop: () => tween.stop(),
        //    }
        //    return ctrl;
        //},

    }

    return module;
}
