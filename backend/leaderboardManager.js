
export default class LeaderboardManager {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.cache = { leaderboard: [], timestamp: 0 };
        this.lastUpdate = Date.now();
    }

    refresh() {
        this.lastUpdate = Date.now();
        let rows = this.dbManager.getLeaderboard();
        this.cache = { leaderboard: rows, timestamp: Date.now() };
    }

    get() {
        return this.cache;
    }

    wouldMakeLeaderboard(score, time, season) {
        let scorePerSecond = score / (time / 1000);
        let seasonLeaderboard = this.cache.leaderboard.filter(row => row.season === season);

        return seasonLeaderboard.length < 25 ||
            scorePerSecond > Math.min(...seasonLeaderboard.map(row => row.score / (row.time / 1000)));
    }
}