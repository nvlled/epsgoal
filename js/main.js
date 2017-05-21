"use strict";

// TODO:
// * createGrid([x, y, z])
// * prevent simulatenous coin swap
// * improve board API (custom animation speed)
// * simple game menu
// * responsive game world size 
// * prioritize horizontal clearing on dropout
//      (or make clearing rule less ambiguous)

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

var pairMatchBoard;
var dropoutBoard;

var greeting;
var menuTexts;
var controlPlayer = true;
var playerStart;
var quitBtn;
var currentGame;
var gameOverText;

var dirs = {
    up:     {i: -1, j:  0},
    left:   {i:  0, j: -1},
    right:  {i:  0, j:  1},
    down:   {i:  1, j:  0},
}

let inputHandler = () => {
}

var CHARPREF = "char-";
function charname(s, n) { 
    return CHARPREF+s+"_"+util.leftpad(n+"", 2, "0");
}

function preload() {
    var load = game.load;
    load.baseURL = "assets/";

    load.images([
        "sky",
        "heaven",
        "sky",
        "starfield",
        "fire",
        "tron",
        "metal",
        "ooze",
    ]);

    load.bitmapFont("gameFont", 
            "fonts/bitmapFonts/gem.png",
            "fonts/bitmapFonts/gem.xml"
    );

    load.image("ground", "platform.png");
    load.image("star", "star.png");
    load.spritesheet("dude", "dude.png", 32, 48);
    load.spritesheet("player", "player/p_spritesheet.png", 73, 97, 14);
    load.image("player_jump", "player/p_jump.png");
    load.image("player_duck", "player/p_duck.png");

    load.spritesheet("button", "buttons/flixel-button.png", 80, 20);

    load.spritesheet("coin_gold", "coin_gold.png", 32, 32);
    load.spritesheet("coin_silver", "coin_silver.png", 32, 32);
    load.spritesheet("coin_copper", "coin_copper.png", 32, 32);

    load.image("plus", "plus.png");
    load.image("equals", "equals.png");
    load.image("diamond", "diamond.png");

    load.image("block", "block.png");

    for (var i = 1; i <= 12; i++) {
        var n = util.leftpad(i+"", 2, "0");
        var name = "M_"+n;
        var fullname = CHARPREF + name;
        load.spritesheet(fullname, "" + name +".png", 16, 17);
    }
    for (var i = 1; i <= 12; i++) {
        var n = util.leftpad(i+"", 2, "0");
        var name = "F_"+n;
        var fullname = CHARPREF + name;
        load.spritesheet(fullname, "" + name +".png", 16, 17);
    }
}

let updates = [];

function createPlayer() {
    playerStart = {x: game.camera.width/2, y: game.world.height - game.camera.height/2};
    let player = game.add.sprite(playerStart.x, playerStart.y, "player");
    game.physics.arcade.enable(player);

    player.body.bounce.y = 0.2;
    player.body.gravity.y = 900;
    player.body.collideWorldBounds = true;
    player.animations.add("left", [0, 1, 2, 3, 7, 8, 9], 10, true);
    player.animations.add("right", [5, 6, 7, 8], 10, true);
    player.animations.add("still", [14], 10, true);

    player.anchor.set(0.5);

    return player;
}

function create() {
    game.time.desiredFPS = 40;

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.setBounds(0, 0, 2000, 2000);

    let skybg = game.add.sprite(0, 0, "heaven");
    skybg.width = game.world.width;
    skybg.height = game.world.height;


    let boardY = 200;
    pairMatchBoard = createPairMatch(50, boardY,
        [
            ["a", "a", "0"],
            ["a", "b", "c"],
            ["a", "c", "b"],
            ["b", "b", "a"],
            ["c", "c", "b"],
        ]);

    let dropTable = [
                ["a", "a", "a", "0"],
                ["b", "b", "b", "0"],
                ["c", "c", "c", "0"],
                ["d", "d", "d", "0"],
                ["a", "b", "c", "d"],
                ["a", "c", "d", "b"],
            ];

    dropoutBoard = createDropout(
            pairMatchBoard.getY()+pairMatchBoard.width*2, 
            boardY,
            dropTable,
    );

    let createTable = (b) => {
        createAlgebraTable(
            b.getX()+b.width,
            b.getY(), 
            b.table, b.elemSprites);
    }

    dropoutBoard.onGameOver = () => {
        let b = dropoutBoard;
        let {x, y} = b.toXY(b.rows/2, b.cols/2);
        gameOverText.x = b.getX() + x - gameOverText.width/2;
        gameOverText.y = b.getY() + y;
        gameOverText.alpha = 1;
    }

    gameOverText = game.add.bitmapText(0, 0, "gameFont", "game over");
    gameOverText.alpha = 0;


    player = createPlayer();
    game.camera.follow(player);
    cursors = game.input.keyboard.createCursorKeys();

    let menus = [
        {
            text: "Pair match game",
            x: 50,
            y: game.world.height - 50,
            board: pairMatchBoard,
        },

        {
            text: "Drop game",
            x: 50,
            y: game.world.height - 100,
            board: dropoutBoard,
        }
    ];

    menuTexts = game.add.group();
    menus.forEach(menu => {

        let btn = createButton(menu.x, menu.y, menu.text,
            {   padding: 10,
                //bgImg: "fire",
                onInputUp: (self) => {
                    if (currentGame)
                        return;

                    gameOverText.alpha = 0;
                    currentGame = menu;

                    sequence(
                        x=> tweener(player, {alpha: 0}, 500),
                        x=> {
                            controlPlayer = false;
                            //quitBtn.body.velocity.set(0, 0);
                            game.camera.flash("red", 100, 0.5);
                            let board = menu.board;
                            player.y = board.getY() - 300;
                            player.x = board.getX() + board.width/2;
                            quitBtn.position.set(
                                    board.getX()+board.width-quitBtn.width,
                                    board.getY()-50);
                        },
                        x=> tweener(player, {alpha: 1}, 500),
                        x=> {
                            let board = menu.board;
                            game.camera.unfollow();
                            game.camera.setPosition(
                                    board.getX()-board.width/4, 
                                    board.getY()-board.height/2,
                            );
                            //self.body.velocity.set(0, 0);
                            quitBtn.show();
                            self.position.set(menu.x, menu.y);
                            if (menu.board.start)
                                menu.board.start();
                        },
                    ).start();
                }
            });

        //let text = game.add.bitmapText(obj.x, obj.y, "gameFont", obj.text);
        //text.info = obj;
        //game.physics.arcade.enable(text);
        //menuTexts.add(text);
    });

    //quitBtn = game.add.bitmapText(0, 0, "gameFont", "Quit");
    //quitBtn.alpha = 0;
    //quitBtn.inputEnabled = true;
    //quitBtn.events.onInputUp.add(() => {
    //});

    quitBtn = createButton(0, 0, "QUIT",
            {   padding: 10,
                onInputUp: () => {
                    sequence(
                        x=> tweener(player, {alpha: 0}, 500),
                        x=> {
                            controlPlayer = true;
                            player.position.set(playerStart.x, playerStart.y);
                            game.camera.follow(player);
                            quitBtn.hide();
                            currentGame.board.stop();
                            currentGame = null;
                        },
                        x=> tweener(player, {alpha: 1}, 500),
                    ).start();
                }
            });
    quitBtn.hide();

    //game.physics.arcade.enable(quitBtn);
}

function update() {
    //board.phaserGroups.board.position.x++;

    var hitPlatform = game.physics.arcade.collide(player, platforms);

    game.physics.arcade.collide(player, pairMatchBoard.edges);
    game.physics.arcade.collide(player, dropoutBoard.edges);
    //game.physics.arcade.collide(player, dropoutBoard.edges);

    //let quit = game.physics.arcade.collide(player, quitBtn);
    //if (quit) {
    //    player.position.set(playerStart.x, playerStart.y);
    //    game.camera.follow(player);
    //}

    //let menuText = game.physics.arcade.collide(player, menuTexts, (_, menuText) => {
    //    if (currentMenu)
    //        return;
    //});

    if (controlPlayer) {
        if (cursors.left.isDown) {
            player.body.velocity.x = -150;
            player.animations.play("left");
            player.scale.set(-1, 1);
        } else if (cursors.right.isDown) {
            player.body.velocity.x = 150;
            player.scale.set(1, 1);
            player.animations.play("right");
        } else if (cursors.down.isDown) {
            player.key = "player_duck";
        } else {
            player.body.velocity.x = 0;
            player.animations.stop();
            player.frame = 4;
        }

        if (cursors.up.isDown) {
            player.key = "player_jump";
            player.body.velocity.y = -450;
        }
    } else {
        player.body.velocity.x = 0;
        player.animations.stop();
        player.frame = 4;
    }
    inputHandler();
}
