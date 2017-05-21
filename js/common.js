
function mapElemSprites(elems, spritenames, config=()=>{}) {
    let elem2Sprite = {};
    let sprite2Elem = {};
    elems.forEach((elem, i) => {
        let spriteName  = spritenames[i] || "star";
        elem2Sprite[elem] = spriteName;
        sprite2Elem[spriteName] = elem;
    })

    return {
        elemName(sprite) { return sprite2Elem[sprite]; },
        spriteName(elem) { return elem2Sprite[elem]; },

        createSprite(elem) {
            let name = this.spriteName(elem);
            let sprite = game.add.sprite(0, 0, name);
            try {
                config(sprite);
            } catch (e) { }
            return sprite;
        },
    }
}

function createAlgebraTable(x, y, table, elemSprites) {
    let rows = table.length;
    let cols = table[0].length;

    table.forEach(row => {
        cols = Math.max(cols, row.length);
    });
    cols++;

    let board = createBoard(rows, cols, 
            {
                cellalpha: 0.1,
                cellsize: 35, 
                cellspc: 2,
                bgname: "",
                cellname: "block",
            });
    board.setBoardPosition(x, y);

    table.forEach((row, i) => {
        let idx = 0;
        for (let j = cols-row.length-1; j < cols; j++) {
            let sprite;
            if (j == row.length-1) {
                sprite = game.add.sprite(0, 0, "equals");
            } else {
                let elem = row[idx];
                sprite = elemSprites.createSprite(elem);
                idx++;
            }
            board.set(sprite, i, j);
        }
    });
    return board;
}

function createButton(x, y, text, 
        {
            bgImg="sky",
            padding=10,
            bgTint=0xeeeeee,
            txtTint=0xffeeee,
            onInputDown=() => {},
            onInputUp=() => {},
        } = {}) {
    let btnText = game.add.bitmapText(0, 0, "gameFont", text);
    let btnBg = game.add.sprite(0, 0, bgImg);
    let btnGroup = game.add.sprite();

    btnBg.width = btnText.width + padding*2;
    btnBg.height = btnText.height + padding*2;
    btnBg.x -= padding;
    btnBg.y -= padding;

    //btnGroup.add(btnBg);
    btnGroup.addChild(btnBg);
    btnGroup.addChild(btnText);
    btnGroup.position.set(x, y);

    let inputDown = false;
    let inContact = false;

    let onDown = () => {
        btnBg.tint = 0xddffdd;
        btnText.tint = 0xff1111;
        onInputDown(btnGroup);
    }
    let onUp = () => {
        btnBg.tint = bgTint;
        btnText.tint = txtTint;
        onInputUp(btnGroup);
    }

    btnGroup.inputEnabled = true;
    btnGroup.events.onInputOver.add(() => {
        btnBg.tint = bgTint;
        btnText.tint = txtTint;
    });
    btnGroup.events.onInputOut.add(() => {
        btnBg.tint = 0xffffff;
        btnText.tint = 0xffffff;
    });
    btnGroup.events.onInputDown.add(() => {
        inputDown = true;
        onDown();
    });
    btnGroup.events.onInputUp.add(() => {
        inputDown = false;
        onUp();
    });

    //game.physics.arcade.enable(btnGroup);
    //btnGroup.body.immovable = true;

    let update = btnGroup.update;
    let lastContact = 0;
    //btnGroup.update = (...args) => {
    //    update(...args);

    //    let contact = game.physics.arcade.collide(player, btnGroup);
    //    //console.log(">", game.time.elapsedSince(lastContact));

    //    if (!contact && inContact) {
    //        onUp();
    //    } else if (inContact && game.time.elapsedSince(lastContact) > 3000) {
    //        onDown();
    //        lastContact = +new Date;
    //    }

    //    inContact = contact;
    //}

    btnGroup.show = () => {
        btnGroup.renderable = true;
        btnGroup.exists = true;
    }
    btnGroup.hide = () => {
        btnGroup.renderable = false;
        btnGroup.exists = false;
    }
    
    Object.defineProperty(btnGroup, 'width', { get: () => btnBg.width+padding*2 });
    Object.defineProperty(btnGroup, 'height', { get: () => btnBg.height+padding*2 });
    return btnGroup;
}

