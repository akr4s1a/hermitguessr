import GameUtils from "./gameUtils.js";
export default class GameSession {
    constructor(userCode, format, acceptable, ip) {
        this.userCode = userCode;
        this.gameCode = GameUtils.generateCode();
        this.format = format;
        this.acceptable = acceptable;
        this.ip = ip;
        this.startTime = Date.now();
        this.score = 0;
        this.panos = [];
        this.total = 0;
        this.beta = false;
    }

    addGuess(panorama, score, distance, guess) {
        this.panos.push({ panorama, score, distance, guess });
        this.score += score;
        this.total += 1;
    }

    isComplete() {
        return this.total >= 5;
    }

    getTimeTaken() {
        return Date.now() - this.startTime;
    }

    getSeasonText() {
        let seasons = Object.keys(this.acceptable).filter(k => this.acceptable[k]);
        return `Season${seasons.length > 1 ? "s" : ""} ${seasons.join(", ").replace(/, ([^,]*)$/, ' and $1')}`;
    }
}