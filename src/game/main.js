var game;
var gameData;

var fontName = 'sans-serif';
var googleFontName = 'Patrick Hand SC';
var titleFontName = 'sans-serif';
var titleGoogleFontName = 'Patrick Hand SC';

WebFontConfig = {
    active: function() { fontName = googleFontName; titleFontName = titleGoogleFontName; },
    google: { families: [ googleFontName ] }
};

var fx;
var ambient;
var audioFallback = (Phaser.Device.isAndroidStockBrowser()) ? true : false;
window.PhaserGlobal = { disableWebAudio: audioFallback };

var colors = {normalBG: '#9cdeff', normalStroke: '#2c3e50'};
var tints = {normalBG: 0x9cdeff, normalStroke: 0x2c3e50};

window.onload = function() {

    game = new Phaser.Game("100%", "100%", Phaser.CANVAS, '');

    game.state.add('boot', bootState);
    game.state.add('load', loadState);
    game.state.add('game', gameState);

    game.state.start('boot');

    // improved experience for games in iframes
    window.focus();
    document.body.addEventListener('click',function(e) {
        window.focus();
    },false);

};
