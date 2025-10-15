import { GameState } from './gameState.js';
import { UIElements } from './uiHandler.js';
import { SocketService } from './socketService.js';
import { clearAllSeasonIcons } from './gameLogic.js';
import { setupSeasonMenu, loadLocalSettings } from './uiHandler.js';
import { setupEventListeners } from './uiHandler.js';
import { createGuessHandler } from '../Leaflet/guessHandler.js';


function start() {
    init();

    let state = new GameState();
    let dom = new UIElements(state);
    let socketService = new SocketService(state, dom);

    let guessHandler = createGuessHandler(state, dom);
    Mapcrafter.addControl(guessHandler, "topright", 1);

    setupSeasonMenu();
    loadLocalSettings(state, dom);
    setupEventListeners(state, dom, socketService, guessHandler);

    window.addEventListener('gameReset', () => {
        state.reset();
        dom.reset();
        guessHandler.reset();
        clearAllSeasonIcons(state);
    });

    dom.get("startBtn").disabled = true;
    dom.get("startBtn").title = "Websocket connection not established";

    socketService.connect();

    pannellum.viewer('panorama', {
        type: "equirectangular",
        panorama: "./images/ca89abc6.webp",
        autoLoad: true,
        yaw: 180,
    });
}

start();
