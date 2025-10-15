import DatabaseManager from './databaseManager.js'
import BanManager from './banManager.js'
import LeaderboardManager from './leaderboardManager.js'
import MessageHandler from './messageHandler.js'
import PanoramaManager from './panoramaManager.js'
import panos from '../panos.json' with { type: 'json' };
import banned from '../banned.json' with { type: 'json' };

export default class GameManager {
    constructor(db) {
        this.db = db;
        this.clients = new Map();
        this.games = new Map();
        this.formatCount = {};

        this.banManager = new BanManager(db, banned);
        this.dbManager = new DatabaseManager(db);
        this.leaderboard = new LeaderboardManager(db);
        this.panoManager = new PanoramaManager(panos);
        this.messageHandler = new MessageHandler(this);

        this.leaderboard.refresh();
    }

    getLeaderboard() {
        return this.leaderboard.get();
    }

    async proc(ws) {
        ws.send(JSON.stringify({ type: "welcome" }));
        ws.lastTime = Date.now();
        ws.clientID = ws._socket.remoteAddress;
        ws.locked = false;

        if (await this.banManager.isIPBanned(ws.clientID)) {
            console.log("BANNED IP:", ws.clientID);
            ws.send(JSON.stringify({ type: "hard_banned" }));
            await this.banManager.logBan({ ip: ws.clientID });
            setTimeout(() => ws.terminate(), 1000);
            return;
        }

        ws.on("message", async (rawData) => {
            try {
                ws.lastTime = Date.now();
                let data = JSON.parse(rawData);

                this.clients.set(ws.clientID, ws);

                ws.locked = true;
                await this.messageHandler.handle(ws, data);
                ws.locked = false;

            } catch (err) {
                ws.locked = false;
                console.error('Message handling error:', err);
                ws.send(JSON.stringify({ type: "timeout" }));
            }
        });
    }
};