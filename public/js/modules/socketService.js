import { HGCONFIG } from './config.js';
import { handlers } from './messageHandlers.js';
import { showTemporaryMessage } from './uiHandler.js'

export class SocketService {
    constructor(state, dom) {
        this.state = state;
        this.dom = dom;
        this.keepAliveInterval = null;
    }

    connect() {
        this.state.socket = new WebSocket(HGCONFIG.WS_URL);
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.state.socket.addEventListener("open", () => this.onOpen());
        this.state.socket.addEventListener("close", () => this.onClose());
        this.state.socket.addEventListener("error", () => this.onError());
        this.state.socket.addEventListener("message", (event) => this.onMessage(event));
    }

    onOpen() {
        let startBtn = this.dom.get("startBtn");
        startBtn.disabled = false;
        startBtn.title = "";
        startBtn.innerHTML = "Start Game";
        this.keepAliveInterval = setInterval(() => {
            this.send({ type: "keepAlive" });
        }, HGCONFIG.KEEP_ALIVE_INTERVAL);
    }

    onClose() {
        let startBtn = this.dom.get("startBtn");
        startBtn.disabled = true;
        startBtn.title = "Websocket connection not established";
        clearInterval(this.keepAliveInterval);
    }

    onError() {
        let startBtn = this.dom.get("startBtn");
        startBtn.disabled = true;
        startBtn.title = "Websocket connection not established";
        showTemporaryMessage(this.dom, "Unable to contact server", 4000);
        
    }

    onMessage(event) {
        let data = JSON.parse(event.data);
        let handler = handlers[data.type];
        if (handler) {
            handler(data, this.state, this.dom);
        }
    }

    send(data) {
        if (this.state.socket && this.state.socket.readyState === WebSocket.OPEN) {
            this.state.socket.send(JSON.stringify(data));
        }
    }

    close() {
        if (this.state.socket) {
            this.state.socket.close();
        }
        clearInterval(this.keepAliveInterval);
    }
}
