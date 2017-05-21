
//var game = new Phaser.Game(800, 600, Phaser.AUTO, '', 
//        {preload, create, update, enableDebug: false});

var game = new Phaser.Game({
    width: "100",
    height: "100",
    renderer: Phaser.AUTO,
    antialias: true,
    multiTexture: true,
    state: { preload, create, update},
});

var platforms;
var player;
var cursors;

var dirs = {
    up:     {i: -1, j:  0},
    left:   {i:  0, j: -1},
    right:  {i:  0, j:  1},
    down:   {i:  1, j:  0},
}

var util = {
    leftpad: function(str, n, ch) {
        var pref = [];
        for (var i = 0; i < n-str.length; i++) {
            pref.push(ch);
        }
        return pref.join("") + str;
    },
}

var CHARPREF = "char-";
function charname(s, n) { return CHARPREF+s+"_"+n; }

function preload() {
    var load = game.load;
    load.image("sky", "assets/sky.png");
    load.image("toxic", "assets/skies/toxic.png");
    load.image("fire", "assets/skies/fire.png");
    load.image("tron", "assets/textures/tron.png");
    load.image("metal", "assets/textures/metal.png");
    load.image("ooze", "assets/textures/ooze.png");
    load.image("cyberglow", "assets/textures/cyberglow.png");

    load.image("ground", "assets/platform.png");
    load.image("star", "assets/star.png");
    load.spritesheet("dude", "assets/dude.png", 32, 48);

    load.spritesheet("coin_gold", "assets/board/coin_gold.png", 32, 32);
    load.spritesheet("coin_silver", "assets/board/coin_silver.png", 32, 32);
    load.spritesheet("coin_copper", "assets/board/coin_copper.png", 32, 32);

    load.image("plus", "assets/board/plus.png");
    load.image("equals", "assets/board/equals.png");
    load.image("diamond", "assets/diamond.png");

    load.image("cell", "assets/sprites/block.png");

    for (var i = 1; i <= 12; i++) {
        var n = util.leftpad(i+"", 2, "0");
        var name = "M_"+n;
        var fullname = CHARPREF + name;
        load.image(fullname, "assets/chars/Males/" + name +".png");
    }
    for (var i = 1; i <= 12; i++) {
        var n = util.leftpad(i+"", 2, "0");
        var name = "F_"+n;
        var fullname = CHARPREF + name;
        load.image(fullname, "assets/chars/Females/" + name +".png");
    }
}

function createCharAlgebra() {
    // identity causes poof
    let alg = createAlgebra(
          ["a", "b", "c"], 
    /*a*/[["c", "b", "a"],
    /*b*/ ["c", "a", "a"],
    /*c*/ ["a", "a", "c"]]
    );
    alg.spritenames = {
        "a": "coin_gold",
        "b": "coin_silver",
        "c": "coin_copper",
    }
    return agl;
}

function createAlgebraBoard(algebra) {
    let size = algebra.elems.length;
    return createBoard(size+1, size+1,
            {

            });
}

function mapElemSprites(elems, spritenames, config=()=>{}) {
    let elem2Sprite = {};
    let sprite2Elem = {};
    elems.forEach((elem, i) => {
        let spriteName  = spritenames[i] || "diamond";
        elem2Sprite[elem] = spriteName;
        sprite2Elem[spriteName] = elem;
    })

    return {
        elemName(sprite) { return sprite2Elem[sprite]; },
        spriteName(elem) { return elem2Sprite[elem]; },

        createSprite(elem) {
            let name = this.spriteName(elem);
            let sprite = game.add.sprite(0, 0, name);
            config(sprite);
            return sprite;
        },
    }
}


var board, boardEdges;

function create() {
    game.physics.startSystem(Phaser.Physics.ARCADE);
    //game.world.setBounds(0, 0, 2000, 2000);
    
    // doing this would've been a lot more fun
    // if I didn't procrastinate until the last minute
    
    // goodluck with level design mang
    let alg = createAlgebra({
        elems: ["a", "b", "c", "0"],
        identity: "0",
        table: [
            ["a", "a", "c"],
            ["a", "b", "0"],
            ["a", "c", "b"],
            ["b", "c", "0"],
            ["b", "b", "a"],
            ["c", "c", "c"],
        ],
    });

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


    let skybg = game.add.sprite(0, 0, "sky");
    skybg.width = game.world.width;
    skybg.height = game.world.height;


    board = createBoard(5, 5, 
            {
                cellsize: 70, 
                cellspc: 5,
                bgname: "fire",
                cellname: "metal",
            });
    board.setBoardPosition(10, 10);

    //-----------------------------
    // random creation

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

    let createMapGuide = (alg, elemSprites, size=30) => {
        let group = game.add.group();
        alg.table.forEach(([x,y, z]) => {
            let xs = elemSprites.createSprite(x);
            xs.width = size; xs.height = size;
            let ys = elemSprites.createSprite(y);
            ys.width = size; ys.height = size;
            let zs = elemSprites.createSprite(z);
            zs.width = size; zs.height = size;

            let plus = game.add.sprite(0, 0, "plus")
            plus.width = size; plus.height = size;
            let equals = game.add.sprite(0, 0, "equals")
            equals.width = size; equals.height = size;

            group.addChild(xs);
            group.addChild(plus);
            group.addChild(ys);
            group.addChild(equals);
            group.addChild(zs);
        });

        let rows = alg.table.length;
        let cols = alg.table[0].length + 2;
        group.align(cols, rows, size, size);
        return group;
    }

    let mapguide = createMapGuide(alg, elemSprites);
    mapguide.x = board.getX() + board.width + 10;
    mapguide.y = board.getY() + board.cellsize;

    //-----------------------------

    let startPos = {};
    let endPos = {};

    board.onCellTap = () => {};

    board.onCellDragUpdate = (i, j) => {
        endPos = {i, j};
    }
    board.onCellDragStart = (i, j) => {
        startPos = {i, j};
    };
    board.onCellDragStop = (i, j) => {
        let v = board.subpos(endPos, startPos);
        v = board.normalizepos(v);

        if (v.i == 0 && v.j == 0)
            return;

        let pos = board.addpos(startPos, v);

        let srcSprite = board.get(startPos.i, startPos.j);
        let dstSprite = board.get(pos.i, pos.j);

        if (!srcSprite || !dstSprite)
            return;

        // sick DSL dude /s?
        // nice memleak bruh /s....?
        sequence(
            x=> board.moveTo(srcSprite, pos.i, pos.j),
            x=> parallel(
                x=> tweener(srcSprite, {alpha: 0}, 500),
                x=> tweener(dstSprite, {alpha: 0}, 500),
                x=> {
                    let emitter = game.add.emitter(
                                    srcSprite.centerX, 
                                    srcSprite.centerY, 30);
                    emitter.makeParticles(["star"]);
                    emitter.start(false, 500, 120, 7);
                }
            ),
            x=> {
                let a = elemSprites.elemName(srcSprite.key);
                let b = elemSprites.elemName(dstSprite.key);
                let c = alg.apply(a, b);

                srcSprite.destroy();
                dstSprite.destroy();

                board.remove(pos.i, pos.j);
                if (alg.identity == c)
                    return;

                console.log("apply", a, b, c);

                let newsprite = elemSprites.createSprite(c);
                newsprite.alpha = 0;

                board.set(newsprite, pos.i, pos.j);

                tweener(newsprite, {alpha: 1}, 500).start();
            },
        ).start();

    };

    //-----------------------------


    //let goldCoin = game.add.sprite(0, game.world.height - 100, "coin_gold");
    //goldCoin.animations.add("rotate");
    //goldCoin.animations.play("rotate", 9, true);
    //board.set(goldCoin, 0, 0);

    //let silverCoin = game.add.sprite(0, game.world.height - 100, "coin_silver");
    //silverCoin.animations.add("rotate");
    //silverCoin.animations.play("rotate", 9, true);
    //board.set(silverCoin, 1, 0);

    //let copperCoin = game.add.sprite(0, game.world.height - 100, "coin_copper");
    //copperCoin.animations.add("rotate");
    //copperCoin.animations.play("rotate", 9, true);
    //copperCoin.position.set(-5, -5);
    //copperCoin.width = 10;
    //copperCoin.height = 10;
    //goldCoin.addChild(copperCoin);

    //board.set(silverCoin, 1, 0);

    //sequence(
    //    x=> board.moveTo(goldCoin, 2, 2),
    //    x=> board.dropTo(goldCoin, 0, -1),
    //).start();

    player = game.add.sprite(32, game.world.height - 300, "dude");
    game.physics.arcade.enable(player);

    player.body.bounce.y = 0.2;
    player.body.gravity.y = 900;
    player.body.collideWorldBounds = true;
    player.animations.add("left", [0, 1, 2, 3], 10, true);
    player.animations.add("right", [5, 6, 7, 8], 10, true);

    cursors = game.input.keyboard.createCursorKeys();


    game.camera.follow(player);
}

function tweener(sprite, ts, speed, easing) {
    let tween = game.add.tween(sprite);
    tween.to(ts, speed, easing);

    let ctrl = {
        start: () => {
            tween.start();
            tween.onComplete.add(() => {
                if (ctrl.done)
                    ctrl.done();
            });
        },
        stop: () => {
            tween.stop();
            if (ctrl.done)
                ctrl.done();
        }
    }
    return ctrl;
}

function sequence(...actions) {
    if (actions.length == 0)
        return {start: () => {}};

    let i = 0;
    let mainCtrl;

    let cc = () => {
        if (i >= actions.length) {
            if (mainCtrl.done)
                mainCtrl.done();
            return;
        }

        let fn = actions[++i];
        if (typeof fn == "function") {
            let ctrl = fn();
            if (ctrl && typeof ctrl.start == "function") {
                ctrl.start();
                ctrl.done = cc;
            } else {
                setTimeout(cc);
                console.log("invalid action in sequence:", ctrl);
            }
        } else {
            setTimeout(cc);
            console.log("not a function in sequence: ", fn);
        }
    }

    mainCtrl = {
        start: () => {
            let ctrl = actions[i]();
            if (!ctrl) {
                if (mainCtrl.done) mainCtrl.done();
            }
            ctrl.done = cc;
            if (!ctrl.start)
                cc();
            else
                ctrl.start();
        },
    }
    return mainCtrl;
}

function parallel(...actions) {
    let i = 0;
    let mainCtrl;

    let count = 0;
    let cc = () => {
        count++;

        if (count >= actions.length) {
            if (mainCtrl.done)
                mainCtrl.done();
            return;
        }

    }

    mainCtrl = {
        start: () => {
            actions.forEach(fn => {
                if (typeof fn == "function") {
                    let ctrl = fn();
                    if (ctrl && typeof ctrl.start == "function") {
                        ctrl.start();
                        ctrl.done = cc;
                    } else {
                        setTimeout(cc);
                        console.log("invalid action in sequence:", ctrl);
                    }
                } else {
                    setTimeout(cc);
                    console.log("not a function in sequence: ", fn);
                }
            });
        },
    }
    return mainCtrl;
}

function loop(cond, body) {
    let ctrl = {
        start: () => {
            let id = setTimeout(() => {
                if (cond()) {
                    body();
                } else {
                    clearTimeout(id);
                    if (ctrl.done)
                        ctrl.done();
                }
            });
        }
    }
    return ctrl;
}

function update() {
    //board.phaserGroups.board.position.x++;

    hitPlatform = game.physics.arcade.collide(player, boardEdges);

    var hitPlatform = game.physics.arcade.collide(player, platforms);

    if (cursors.left.isDown) {
        player.body.velocity.x = -150;
        player.animations.play("left");
    } else if (cursors.right.isDown) {
        player.body.velocity.x = 150;
        player.animations.play("right");
    } else {
        player.body.velocity.x = 0;
        player.animations.stop();
        player.frame = 4;
    }

    if (cursors.up.isDown) {
        player.body.velocity.y = -450;
    }
}
