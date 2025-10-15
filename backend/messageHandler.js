import AuthHandler from "./authHandler.js";
import GameSession from "./gameSession.js";
import GameUtils from './gameUtils.js'
import fs from 'fs/promises';

export default class MessageHandler {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.authHandler = new AuthHandler(gameManager)
    }

    async handle(ws, data) {
        let handlers = {
            'keepAlive': (data) => {
                this.handleKeepAlive(ws, data)
            },
            'startGame': (data) => {
                this.handleNewGame(ws, data)
            },
            'setName': (data) => {
                this.handleSetName(ws, data)
            },
            'choice': (data) => {
                this.handleChoice(ws, data)
            },
            'admin': (data) => {
                this.handleAdmin(ws,data)
            },
            'admin_dash': (data) => {
                this.handleAdminDash(ws,data)
            },
            'admin_approve': (data) => {
                this.handleAdminApprove(ws,data)
            }
        };

        let isAdmin = data.type.startsWith('admin')

        if (isAdmin){
            let verify = this.verifyToken(data)
            if (!verify) {
                ws.send(JSON.stringify({type: 'refresh'}));
            }
        }
        let handler = handlers[data.type];
        if (handler) {
            await handler(data);
        }
    }
    handleKeepAlive(ws) {
        ws.send(JSON.stringify({ type: "keepAlive" }));
    }
    verifyToken(data){
        return this.authHandler.verify(data.token)
    }
    async handleNewGame(ws, data) {
        ws.userCode = data.user_code || GameUtils.generateCode();

        if (await this.gameManager.banManager.isUserCodeBanned(ws.userCode)) {
            ws.send(JSON.stringify({ type: "banned" }));
            await this.gameManager.banManager.logBan({ user_code: ws.userCode });
            setTimeout(() => ws.terminate(), 2000);
            return;
        }

        ws.send(JSON.stringify({ type: "user_code", code: ws.userCode }));

        if (!data.acceptable || ![4, 5, 6, 7, 8, 9, 10].some(n => data.acceptable.includes(n.toString()))) {
            ws.send(JSON.stringify({ type: "no_acceptable" }));
            return;
        }

        let acceptable = {
            4: data.acceptable.includes('4'),
            5: data.acceptable.includes('5'),
            6: data.acceptable.includes('6'),
            7: data.acceptable.includes('7'),
            8: data.acceptable.includes('8'),
            9: data.acceptable.includes('9'),
            10: data.acceptable.includes('10')
        };

        this.gameManager.panoManager.initializeUserPanos(ws.userCode, acceptable);

        let session = new GameSession(ws.userCode, data.format, acceptable, ws._socket.remoteAddress);
        this.gameManager.games.set(ws.userCode, session);
        this.gameManager.formatCount[data.format] = (this.gameManager.formatCount[data.format] || 0) + 1;

        ws.send(JSON.stringify({ type: "code", code: session.gameCode }));
        ws.startTime = Date.now();

        setTimeout(() => {
            let pano = this.gameManager.panoManager.getRandomPano(ws.userCode, acceptable);
            ws.send(JSON.stringify({
                type: "panorama",
                panorama: pano.key,
                season: pano.season
            }));
        }, 250);
    }

    async handleSetName(ws, data) {
        ws.name = data.username.substring(0, 10).toLowerCase();

        if (this.gameManager.banManager.isUsernameBanned(ws.name)) {
            ws.send(JSON.stringify({ type: "banned" }));
            await this.gameManager.banManager.logBan({
                id: ws.name,
                ip: ws.clientID,
                used_name: ws.name
            });
        }
    }

    async handleChoice(ws, data) {
        let session = this.gameManager.games.get(ws.userCode);
        if (!session) return;

        let currentPano = this.gameManager.panoManager.getCurrentPano(ws.userCode);
        if (!currentPano) return;

        let dist = GameUtils.distance(data.choice.x, currentPano.x, data.choice.z, currentPano.z);
        let score = GameUtils.calculateScore(dist);

        session.addGuess(this.gameManager.panoManager.currentPano.get(ws.userCode), score, dist, data.choice);

        let response = {
            type: "guessAnswer",
            distance: Math.round(dist),
            score: score,
            ans: { x: currentPano.x, z: currentPano.z }
        };

        if (!session.isComplete()) {
            let pano = this.gameManager.panoManager.getRandomPano(ws.userCode, session.acceptable);
            ws.send(JSON.stringify(response));

            setTimeout(() => {
                ws.send(JSON.stringify({
                    type: "panorama",
                    panorama: pano.key,
                    season: pano.season
                }));
            }, 250);
        } else {
            await this.handleGameComplete(ws, session, response);
        }
    }

    async handleGameComplete(ws, session, lastResponse) {
        ws.send(JSON.stringify(lastResponse));

        let username = ws.name || "Anonymous";
        let timeTaken = session.getTimeTaken();
        let scorePerSecond = session.score / (timeTaken / 1000);

        if (scorePerSecond >= 75 ||
            this.gameManager.banManager.filter.isProfane(username) ||
            timeTaken < 5000 ||
            session.score > 500) {
            return;
        }

        let seasonText = session.getSeasonText();
        let highScore = await this.gameManager.dbManager.getUserHighScore(username, seasonText);
        let isNewHighScore = scorePerSecond > highScore;

        ws.send(JSON.stringify({
            type: "gameOver",
            high_score: isNewHighScore
        }));

        if (isNewHighScore) {
            this.gameManager.leaderboard.refresh();
        }

        await fs.writeFile(`./results/${session.gameCode}.json`, JSON.stringify({
            username,
            score: session.score,
            time: timeTaken,
            panos: session.panos,
            acceptable: session.acceptable,
            format: session.format
        }));

        let wouldMakeLeaderboard = this.gameManager.leaderboard.wouldMakeLeaderboard(
            session.score, timeTaken, seasonText
        );

        await this.gameManager.dbManager.saveGameResult({
            username,
            score: wouldMakeLeaderboard ? -Math.abs(session.score) : session.score,
            date: ws.startTime,
            time: timeTaken,
            season: seasonText,
            userCode: ws.userCode,
            gameCode: session.beta ? `beta${session.gameCode}` : session.gameCode
        });
    }

    async handleQueue(ws, data) {
        if (!data.username) return;

        let match = this.gameManager.mpManager.addToQueue(ws, data.username);

        if (match) {
            match.p1.send(JSON.stringify({ type: "game_start" }));
            match.p2.send(JSON.stringify({ type: "game_start" }));
        } else {
            ws.send(JSON.stringify({ type: "queue_join" }));
        }
    }

    async handleAdmin(ws,data) {
        ws.send(JSON.stringify({
            type: "admin_token",
            token: jwt
        }));
    }
    async handleAdminDash(ws,data){
        let adminData = await this.gameManager.dbManager.getAdminData();
        let inProgress = Array.from(this.gameManager.games.values())
            .filter(g => g.total < 5 && Date.now() - g.startTime < 600000);
        ws.send(JSON.stringify({
            type:'admin_dash',
            in_progress: inProgress,
            total_games: adminData.totalGames,
            games_list_size: this.gameManager.games.size,
            game_list: adminData.recentGames,
            format_count: this.gameManager.formatCount,
            reports: adminData.reports
        }));
    }

    async handleAdminApprove(ws,data){
        await this.gameManager.dbManager.adminApprove(data.gameCode);
    }
}