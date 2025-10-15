
export default class LeaderboardManager {
    constructor(db) {
        this.db = db;
        this.cache = { leaderboard: [], timestamp: 0 };
        this.lastUpdate = Date.now();
    }

    refresh() {
        this.lastUpdate = Date.now();

        let query = `
            WITH ScoreTimeRatio AS (
                SELECT username, score, time, season, 
                       score * 1.0 / time AS ratio,
                       ROW_NUMBER() OVER (
                           PARTITION BY username, season 
                           ORDER BY score * 1.0 / time DESC, score DESC, time ASC
                       ) AS rank
                FROM leaderboard
            ),
            TopRatios AS (
                SELECT username, score, time, season, ratio
                FROM ScoreTimeRatio WHERE rank = 1
            ),
            RankedSeasons AS (
                SELECT username, score, time, season, ratio,
                       ROW_NUMBER() OVER (
                           PARTITION BY season 
                           ORDER BY ratio DESC, score DESC, time ASC
                       ) AS RowNum
                FROM TopRatios
            )
            SELECT username, score, time, season
            FROM RankedSeasons WHERE RowNum <= 25
        `;

        this.db.all(query, [], (err, rows) => {
            if (err) {
                console.error('Leaderboard refresh error:', err);
                return;
            }

            rows.sort((a, b) => {
                let ratioA = a.score / (a.time / 1000);
                let ratioB = b.score / (b.time / 1000);
                return ratioB - ratioA;
            });

            this.cache = { leaderboard: rows, timestamp: Date.now() };
        });
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