var GameState = function () {

    var sequence = [2,1,9,8,7,6,4,3,6,7,8,6,7,4,3,2,1,7,6,9,7,6,4,8,9,4,8,3,2,8,3,9,4,7,6,3,8,1];
    //sequence = [];
    var sequenceIndex = -1;
    //sequenceIndex = 0;
    var sequenceDirection = 2; // 1 is forward,  0 is do nothing, -1 is backward, 2 is onclickable (in conversation)
    //sequenceDirection = 0; // disables the shuffle for testing
    var sequenceInterval = 15; // every x frames swap a tile
    var sequenceFrame = 0;

    var startConversationIndex = -1;

    var puzzleBG;
    var clouds;
    var tileborders;
    var checkers;

    var lot;
    var thomas;

    var startPositionThomas = {x: -140, y: -120};

    var tiles = [];
    //var swapTile = { origX: 120, origY: -120, puzzleX: 120, puzzleY: -120 };
    var swapTile = { origX: 40, origY: -40, puzzleX: 40, puzzleY: -40 };

    var text;

    var puzzleIsComplete = false;

    var solveButton;

    var music;

    this.create = function () {

        game.physics.startSystem(Phaser.Physics.P2JS);
        game.physics.p2.restitution = .2;
        game.physics.p2.gravity.y = 250;

        puzzleBG = game.add.group();
        puzzleBG.x = game.world.centerX;
        puzzleBG.y = game.world.centerY;

        clouds = game.add.tileSprite(-game.width/2, -game.height/2, game.width, game.height, 'clouds');
        puzzleBG.add(clouds);

        puzzleBG.create(-512, -512, 'mountain');

        tileborders = game.add.sprite(-160, -160, 'tileborders');
        puzzleBG.add(tileborders);

        checkers = game.add.sprite(game.world.centerX, game.world.centerY, 'checkers');
        checkers.anchor.setTo(0.5, 0.5);
        game.physics.p2.enable(checkers, false);
        checkers.body.clearShapes();
        checkers.body.loadPolygon('physicsData', 'mountain');
        checkers.body.static = true;
        checkers.body.debug = false;

        for (var t = 0; t < gameData.tiles.length; t++) {

            var renderTexture = game.add.renderTexture(80, 80, 'tile'+t);

            tiles[t] = game.add.sprite(game.world.centerX + gameData.tiles[t].origX, game.world.centerY + gameData.tiles[t].origY, renderTexture);
            tiles[t].anchor.setTo(0.5, 0.5);
            tiles[t].alpha = 1;

            if (gameData.tiles[t].polygon != "") {
                game.physics.p2.enable(tiles[t], false);
                tiles[t].body.clearShapes();
                tiles[t].body.loadPolygon('physicsData', gameData.tiles[t].polygon);
                tiles[t].body.static = true;
                tiles[t].body.debug = false;
            }

            tiles[t].puzzle = { origX: gameData.tiles[t].origX,
                                origY: gameData.tiles[t].origY,
                                puzzleX: gameData.tiles[t].origX,
                                puzzleY: gameData.tiles[t].origY,
                                homeX: tiles[t].x,
                                homeY: tiles[t].y,
                                hasBody: (gameData.tiles[t].polygon != ""),
                                movable: gameData.tiles[t].movable,
                                renderTexture: renderTexture,
                                id: t
                              };
            tiles[t].inputEnabled = true;
            tiles[t].events.onInputDown.add(clickedTile, this);

        }

        //shuffleTiles();

        lot = game.add.sprite(game.world.centerX + 140, game.world.centerY + 72, 'lot');
        lot.anchor.setTo(0.5, 0.5);
        game.physics.p2.enable(lot, false);
        lot.body.clearShapes();
        lot.body.loadPolygon('physicsData', 'lot');
        lot.body.static = true;
        lot.body.debug = false;

        thomas = game.add.sprite(game.world.centerX + startPositionThomas.x, game.world.centerY + startPositionThomas.y, 'thomas');
        thomas.anchor.setTo(0.5, 0.5);
        game.physics.p2.enable(thomas, false);
        thomas.body.clearShapes();
        thomas.body.loadPolygon('physicsData', 'thomas');
        thomas.body.static = true;
        thomas.body.debug = false;

        game.physics.p2.setImpactEvents(true);
        thomas.body.createBodyCallback(lot, thomasHitLot, this);

        solveButton = game.add.button(game.world.centerX - 120, game.world.centerY + 165, 'solvebutton', solvePuzzle, this, 2, 1, 0);
        solveButton.visible = false;

        createText();

        // when to start shuffling
        //game.time.events.add(Phaser.Timer.SECOND * 11, startShuffling, this);

        // wait and start a conversation
        game.time.events.add(Phaser.Timer.SECOND * 4, showNextStartConversation, this);

        game.load.onLoadComplete.add(onLoadMusicComplete, this);
        startLoadMusic();

    }

    function startLoadMusic() {

        game.load.audio('dream', ['assets/audio/dream.mp3', 'assets/audio/dream.ogg']);
        game.load.start();

    }

    function onLoadMusicComplete() {

        game.load.onLoadComplete.remove(onLoadMusicComplete, this);

        music = game.add.audio('dream');
        music.loopFull();

    }

    function showNextStartConversation() {
        startConversationIndex++;
        if (startConversationIndex >= gameData.startConversation.length) {
            text.visible = false;
        } else {
            if (text != undefined) {
                text.visible = true;
                text.text = gameData.startConversation[startConversationIndex].line;
                if (gameData.startConversation[startConversationIndex].character == 'thomas') {
                    text.fill = '#2980b9';
                } else if (gameData.startConversation[startConversationIndex].character == 'lot') {
                    text.fill = '#c0392b';
                } else {
                    text.fill = '#2c3e50';
                }
                game.time.events.add(Phaser.Timer.SECOND * 4, showNextStartConversation, this);
            }
            if ((startConversationIndex == 4) || text === undefined) {
                startShuffling();
            }
        }
    }

    function startShuffling() {
        sequenceDirection = 1;
    }

    function thomasHitLot(body1, body2) {
        if (text != undefined) {
            if (location.hash.length) {
                text.text = gameData.endMessage[location.hash.substring(1)];
            } else {
                text.text = "Lot en Thomas\ntrouwen!!!\nSave the date\n30/6 - 1 & 2/7\n2017";
            }
            text.fill = '#2c3e50';
            text.visible = true;
        }
    }

    this.resize = function () {

        puzzleBG.x = game.world.centerX;
        puzzleBG.y = game.world.centerY;

        clouds.x = -game.width/2;
        clouds.y = -game.height/2;
        clouds.width = game.width;
        clouds.height = game.height;

        checkers.body.x = game.world.centerX;
        checkers.body.y = game.world.centerY;

        for (var t = 0; t < tiles.length; t++) {
            if (tiles[t].puzzle.hasBody) {
                tiles[t].body.x = tiles[t].puzzle.homeX = game.world.centerX + tiles[t].puzzle.puzzleX;
                tiles[t].body.y = tiles[t].puzzle.homeY = game.world.centerY + tiles[t].puzzle.puzzleY;
            } else {
                tiles[t].x = tiles[t].puzzle.homeX = game.world.centerX + tiles[t].puzzle.puzzleX;
                tiles[t].y = tiles[t].puzzle.homeY = game.world.centerY + tiles[t].puzzle.puzzleY;
            }
        }

        if (lot.body.static) {
            lot.body.x = game.world.centerX + 140;
            lot.body.y = game.world.centerY + 72;
        }

        if (thomas.body.static) {
            thomas.body.x = game.world.centerX + startPositionThomas.x;
            thomas.body.y = game.world.centerY + startPositionThomas.y;
        }

        if (text != undefined) {
            text.x = game.world.centerX
            text.y = game.world.centerY - 48;
        }

        solveButton.x = game.world.centerX - 120;
        solveButton.y = game.world.centerY + 165;
    }

    function clickedTile(tile) {

        if (puzzleIsComplete || sequenceDirection !== 0) {
            return;
        }

        if (tile.puzzle.movable && (
                ((tile.puzzle.puzzleX == swapTile.puzzleX) &&
                    ((tile.puzzle.puzzleY == (swapTile.puzzleY - 80)) || (tile.puzzle.puzzleY == (swapTile.puzzleY + 80)))) ||
                ((tile.puzzle.puzzleY == swapTile.puzzleY) &&
                    ((tile.puzzle.puzzleX == (swapTile.puzzleX - 80)) || (tile.puzzle.puzzleX == (swapTile.puzzleX + 80))))
                )
            )
        {

            swapSwapTileWith(tile);

        } else if (thomas.body.static) {
            thomas.body.static = false;
            setTimeout(function () {
                thomas.body.static = true;
                thomas.body.x = game.world.centerX + startPositionThomas.x;
                thomas.body.y = game.world.centerY + startPositionThomas.y;
                thomas.body.rotation = 0;
                thomas.body.setZeroForce();
                thomas.body.setZeroRotation();
                thomas.body.setZeroVelocity();
                if (text != undefined) {
                    text.visible = false;
                }
            }, 12000);
        }
    }

    function swapSwapTileWith(tile) {

        var swapX = swapTile.puzzleX,
            swapY = swapTile.puzzleY;

        swapTile.puzzleX = tile.puzzle.puzzleX;
        swapTile.puzzleY = tile.puzzle.puzzleY;
        tile.puzzle.puzzleX = swapX;
        tile.puzzle.puzzleY = swapY;

        tile.puzzle.homeX = game.world.centerX + tile.puzzle.puzzleX;
        tile.puzzle.homeY = game.world.centerY + tile.puzzle.puzzleY;

        if (sequenceDirection == 0 && sequenceIndex == sequence.length) {
            sequence.push(tile.puzzle.id);
            sequenceIndex = sequence.length;
            //console.log(sequence.join(','));
        }

        if (!puzzleIsComplete && (puzzleIsComplete = checkPuzzleComplete())) {
            //alert('Puzzle is complete!');
            solveButton.visible = false;
            game.add.tween(tileborders).to({ alpha: 0 }, 2000, "Linear", true);
            game.add.tween(checkers).to({ alpha: 0 }, 2000, "Linear", true);
            setTimeout(function () {
                thomas.body.x = game.world.centerX + startPositionThomas.x;
                thomas.body.y = game.world.centerY + startPositionThomas.y;
                thomas.body.rotation = 0;
                thomas.body.setZeroForce();
                thomas.body.setZeroRotation();
                thomas.body.setZeroVelocity();
                thomas.body.static = false;
            }, 2000);
        }
    }

    function checkPuzzleComplete() {
        if (puzzleIsComplete) {
            return true;
        }
        var isComplete = true;
        for (var t = 0; t < tiles.length; t++) {
            if (tiles[t].puzzle.origX != tiles[t].puzzle.puzzleX || tiles[t].puzzle.origY != tiles[t].puzzle.puzzleY) {
                isComplete = false;
                return isComplete;
            }
        }
        return isComplete;
    }

    function solvePuzzle () {
        //alert('Let me solve the puzzle for you!');
        if (sequenceDirection == 0) {
            sequenceIndex = sequence.length;
            sequenceFrame = 0;
            sequenceDirection = -1;
            solveButton.visible = false;
        }
    }

    this.update = function () {

        if (sequenceDirection === -1 || sequenceDirection === 1) {
            sequenceFrame++;
            if (sequenceFrame >= sequenceInterval) {
                sequenceFrame = 0;
                if (sequenceDirection == 1) {
                    sequenceIndex += 1;
                    var tile = tiles[sequence[sequenceIndex]];
                    swapSwapTileWith(tile);
                    if (sequenceIndex >= (sequence.length - 1)) {
                        sequenceDirection = 0;
                        sequenceIndex = sequence.length;
                        solveButton.visible = true;
                    }
                } else if (sequenceDirection == -1) {
                    sequenceIndex -= 1;
                    var tile = tiles[sequence[sequenceIndex]];
                    swapSwapTileWith(tile);
                    if (sequenceIndex <= 0) {
                        sequenceDirection = 0;
                        sequenceIndex = 0;
                    }
                }
            }
        }

        for (var t = 0; t < tiles.length; t++) {
            tiles[t].puzzle.renderTexture.renderXY(puzzleBG, -(tiles[t].puzzle.origX - 40), -(tiles[t].puzzle.origY - 40), true);
            if (!tiles[t].puzzle.movable) continue;
            if (tiles[t].puzzle.hasBody) {
                tiles[t].body.x += (tiles[t].puzzle.homeX - tiles[t].body.x) / 6;
                tiles[t].body.y += (tiles[t].puzzle.homeY - tiles[t].body.y) / 6;
            } else {
                tiles[t].x += (tiles[t].puzzle.homeX - tiles[t].x) / 6;
                tiles[t].y += (tiles[t].puzzle.homeY - tiles[t].y) / 6;
            }
        }

        clouds.tilePosition.x -= 1;
    }

    function shuffleTiles () {

        var movableTiles = [];
        var puzzleCoords = [];
        for (var t = 0; t < tiles.length; t++) {
            if (tiles[t].puzzle.movable) {
                movableTiles.push(tiles[t]);
                puzzleCoords.push({puzzleX: tiles[t].puzzle.puzzleX, puzzleY: tiles[t].puzzle.puzzleY});
            }
        }

        var randomIndex = randomNumberArray(0, (movableTiles.length - 1));

        for (var t = 0; t < movableTiles.length; t++) {

            movableTiles[t].puzzle.puzzleX = puzzleCoords[randomIndex[t]].puzzleX;
            movableTiles[t].puzzle.puzzleY = puzzleCoords[randomIndex[t]].puzzleY;

            if (movableTiles[t].puzzle.hasBody) {
                movableTiles[t].body.x = movableTiles[t].puzzle.homeX = game.world.centerX + movableTiles[t].puzzle.puzzleX;
                movableTiles[t].body.y = movableTiles[t].puzzle.homeY = game.world.centerY + movableTiles[t].puzzle.puzzleY;
            } else {
                movableTiles[t].x = movableTiles[t].puzzle.homeX = game.world.centerX + movableTiles[t].puzzle.puzzleX;
                movableTiles[t].y = movableTiles[t].puzzle.homeY = game.world.centerY + movableTiles[t].puzzle.puzzleY;
            }
        }
    }

    function randomNumberArray(startNumber, endNumber) {

        if (startNumber === undefined) {
            startNumber = 0;
        }

        if (endNumber === undefined) {
            endNumber = 9;
        }

        var baseNumber = [];
        var randNumber = [];

        for (var i = startNumber; i <= endNumber; i++) {
            baseNumber[i] = i;
        }

        for (i = endNumber; i > startNumber; i--) {
            var tempRandom = startNumber + Math.floor(Math.random() * (i - startNumber));
            randNumber[i] = baseNumber[tempRandom];
            baseNumber[tempRandom] = baseNumber[i];
        }
        randNumber[startNumber] = baseNumber[startNumber];
        return randNumber;
    }

    function createText() {

        text = game.add.text(game.world.centerX, game.world.centerY - 24, "Lot en Thomas\ntrouwen!!!\nSave the date\nPinksterweekend\n2017");
        text.anchor.setTo(0.5);

        text.font = fontName;
        text.fontSize = 38;

        text.fill = '#2c3e50';

        text.align = 'center';
        text.stroke = '#ffffff';
        text.strokeThickness = 2;

        text.visible = false;

    }
};

var gameState = new GameState();




