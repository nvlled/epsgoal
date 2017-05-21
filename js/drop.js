
var game = new Phaser.Game(800, 600, Phaser.AUTO, '', {preload, create, update});
var platforms;
var player;
var cursors;


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
    load.image("ground", "assets/platform.png");
    load.image("star", "assets/star.png");
    load.image("dropgrid", "assets/dropgrid-bg.png");

    load.spritesheet("dude", "assets/dude.png", 32, 48);
    load.spritesheet("chars", "assets/chars/All.png", 48, 51);

    for (var i = 1; i <= 12; i++) {
        var n = util.leftpad(i+"", 2, "0");
        var name = "M_"+n;
        var fullname = CHARPREF + name;
        console.log("char name:", fullname);
        load.image(fullname, "assets/chars/Males/" + name +".png");
    }
}

function createTetro(pivot, shape) {
    //var tetro = game.add.group();
}

//createTetro(
//    [0, 1], // pivot
//    ["111",
//     "010",
//    ]
//);

var tetro;
var ch;


var dropGrid;

function dropSubgame() {
    var w = 400;
    var h = 600;

    var x = 100;
    var y = 250;

    dropGrid = game.add.group();
    //dropGrid.enableBody = true;

    dropGrid.width = w;
    dropGrid.height = h;
    dropGrid.position.setTo(x, y);

    var bg = dropGrid.create(0, 0, "dropgrid");
    bg.width = w;
    bg.height = h;

    borders = game.add.group();
    borders.enableBody = true;
    borders.position.setTo(x, y);
    //dropGrid.add(borders);

    var bottom = borders.create(0, h, "ground");
    bottom.body.immovable = true;
    bottom.x = 0;

    var bw = 5;
    var left = borders.create(0, 0, "ground");
    left.width = bw;
    left.height = h;
    left.body.immovable = true;

    var right = borders.create(w-bw, 0, "ground");
    right.width = bw;
    right.height = h;
    right.body.immovable = true;

}

function create() {

    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.world.setBounds(0, 0, 1600, 1000);

    var sky = game.add.sprite(0, 0, "sky");
    sky.width = game.world.width;
    sky.height = game.world.height;


    dropSubgame();


    //ch = tetro.create(0, 0, "chars", 4);
    //game.physics.arcade.enable(ch);
    //ch.body.gravity.y = 500;
    //ch.body.collideWorldBounds = true;

    //ch = tetro.create(0, 0, "chars", 5);
    //game.physics.arcade.enable(ch);
    //ch.body.gravity.y = 500;
    //ch.body.collideWorldBounds = true;

    //tetro.create(48, 0, "chars", 5);
    //tetro.create(0, 51, "chars", 4);
    
    //tetro.body.gravity.y = 200;

    //player = game.add.sprite(100, 100, "chars", 1);


    platforms = game.add.group();
    platforms.enableBody = true;

    ground = platforms.create(0, game.world.height - 64, "ground");
    ground.scale.setTo(2, 2);
    ground.body.immovable = true;

    var ledge;
    //ledge = platforms.create(400, 400, "ground");
    //ledge.body.immovable = true;

    //ledge = platforms.create(150, 250, "ground");
    //ledge.body.immovable = true;
    //ledge.scale.setTo(0.5, 1);

    tetro = game.add.group();
    tetro.enableBody = true;
    tetro.x = 100;
    tetro.y = 100;


    ch = tetro.create(0, 0, "chars", 3);
    game.physics.arcade.enable(ch);
    //ch.body.gravity.y = 500;
    ch.body.collideWorldBounds = true;
    ch.body.bounce.y = 0.2;
    ch.rotation = 1.5;

    ch = tetro.create(0, 51, "chars", 9);
    ch.rotation = 1.5;

    game.physics.arcade.enable(ch);
    //ch.body.gravity.y = 500;
    ch.body.collideWorldBounds = true;
    ch.body.bounce.y = 0.2;


    player = game.add.sprite(32, game.world.height - 300, "dude");
    game.physics.arcade.enable(player);

    player.body.bounce.y = 0.2;
    player.body.gravity.y = 500;
    player.body.gravity.x = 900;
    player.body.collideWorldBounds = true;
    player.animations.add("left", [0, 1, 2, 3], 10, true);
    player.animations.add("right", [5, 6, 7, 8], 10, true);

    game.camera.follow(player);

    cursors = game.input.keyboard.createCursorKeys();
}

function update() {
    //tetro.rotation+=0.01;

    var hitPlatform = game.physics.arcade.collide(player, platforms);
    game.physics.arcade.collide(ch, platforms);
    game.physics.arcade.collide(ch, player);

    game.physics.arcade.collide(player, borders);

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

    //if (cursors.up.isDown && player.body.touching.down) {
    if (cursors.up.isDown) {
        player.body.velocity.y = -450;
    }

