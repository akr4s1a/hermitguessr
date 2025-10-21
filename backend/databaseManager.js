export default class DatabaseManager {
    constructor(db) { this.db = db; this.initialize(); }

    initialize() {
        const tableStatements = [
            `
            CREATE TABLE IF NOT EXISTS leaderboard (
                username TEXT,
                score INTEGER,
                date INTEGER,
                time INTEGER,
                season TEXT,
                user_code TEXT,
                game_code TEXT
            )
            `,
            `
            CREATE INDEX IF NOT EXISTS leaderboard_index 
            ON leaderboard (username, score, date, time, season)
            `,
            `CREATE TABLE IF NOT EXISTS banned (banned TEXT)`,
            `
            CREATE TABLE IF NOT EXISTS reports (
                username TEXT,
                user_code TEXT,
                game_code TEXT,
                date INTEGER,
                report TEXT
            )
            `,
            `
            CREATE TABLE IF NOT EXISTS admins (
                username TEXT,
                password TEXT
            )
            `
        ];

        const exec = this.db.prepare.bind(this.db);
        for (const query of tableStatements) {
            exec(query).run();
        }
    }

    saveGameResult(data) {
        const query = this.db.prepare(`
            INSERT INTO leaderboard 
            (username, score, date, time, season, user_code, game_code)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        query.run(
            data.username,
            data.score,
            data.date,
            data.time,
            data.season,
            data.userCode,
            data.gameCode
        );
    }

    getUserHighScore(username, season) {
        const rows = this.db.prepare(`
            SELECT * FROM leaderboard 
            WHERE ABS(score / time / 1000) = (
                SELECT MAX(score / time) FROM leaderboard 
                WHERE username = ? AND season = ?
            ) AND username = ? AND season = ?
        `).all(username, season, username, season);

        let maxScore = 0;
        for (const row of rows) {
            const sps = Math.abs(row.score) / (row.time / 1000);
            if (sps > maxScore) maxScore = sps;
        }
        return maxScore;
    }

    getAdminData() {
        const reportRows = this.db.prepare(`SELECT * FROM reports`).all();
        const leaderboardRows = this.db.prepare(`SELECT * FROM leaderboard`).all();

        return {
            reports: reportRows,
            totalGames: leaderboardRows.length,
            recentGames: leaderboardRows.slice(-500).reverse(),
        };
    }

    adminSignup(username, password) {
        const query = this.db.prepare(`
            INSERT INTO admins (username, password)
            VALUES (?, ?)
        `);
        query.run(username, password);
    }

    adminLogin(username) {
        const row = this.db.prepare(`
            SELECT password FROM admins WHERE username = ?
        `).get(username);
        return row || null;
    }

    adminApprove(gameCode) {
        const query = this.db.prepare(`
            UPDATE leaderboard SET score = ABS(score) WHERE game_code = ?
        `);
        query.run(gameCode);
    }
    getLeaderboard() {
        const query = `
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
            FROM RankedSeasons 
            WHERE RowNum <= 25
        `;

        const rows = this.db.prepare(query).all();

        rows.sort((a, b) => {
            const ratioA = a.score / (a.time / 1000);
            const ratioB = b.score / (b.time / 1000);
            return ratioB - ratioA;
        });

        return rows;
    }
    isBanned(entry){
        let banned = this.db.prepare(`
            SELECT * FROM banned WHERE banned= ?
        `).get(entry);
        return !!banned;
    }
}
