import { Core } from "./core/core.js";
import { Game } from "./game/game.js";
window.onload = () => (new Core(true, 256, 192, true))
    .addScene("game", new Game())
    .run("game", (event, assets) => {
    assets.parseIndexFile("assets/index.json");
    event.input
        .addAction("restart", ["KeyR"], [], [3])
        .addAction("undo", ["Backspace", "KeyZ"], [], [1])
        .addAction("pause", ["Enter"], [], [7])
        .addAction("start", ["Enter"], [], [7])
        .addAction("select", ["Space"], [], [0]);
    event.audio.setGlobalVolume(0.50);
});
