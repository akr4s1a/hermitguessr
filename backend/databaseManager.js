export default class DatabaseManager {
    constructor(db) {
        this.db = db;
        this.initialize();
    }

    initialize() {
        this.db.serialize(() => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS leaderboard (
                    username TEXT, score INTEGER, date INTEGER, time INTEGER, 
                    season TEXT, user_code TEXT, game_code TEXT
                )
            `);

            this.db.run(`
                CREATE INDEX IF NOT EXISTS leaderboard_index 
                ON leaderboard (username, score, date, time, season)
            `);

            this.db.run(`CREATE TABLE IF NOT EXISTS banned (banned TEXT)`);

            this.db.run(`
                CREATE TABLE IF NOT EXISTS reports (
                    username TEXT, user_code TEXT, game_code TEXT, 
                    date INTEGER, report TEXT
                )
            `);
            this.db.run(`
                CREATE TABLE IF NOT EXISTS admins (
                username TEXT, password TEXT)
                `)
        });
    }

    async saveGameResult(data) {
        return new Promise((resolve, reject) => {
            this.db.run(
                `INSERT INTO leaderboard (username, score, date, time, season, user_code, game_code) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [data.username, data.score, data.date, data.time, data.season, data.userCode, data.gameCode],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async getUserHighScore(username, season) {
        return new Promise((resolve, reject) => {
            let query = `
                SELECT * FROM leaderboard 
                WHERE ABS(score / time / 1000) = (
                    SELECT MAX(score / time) FROM leaderboard 
                    WHERE username = ? AND season = ?
                ) AND username = ? AND season = ?
            `;

            this.db.all(query, [username, season, username, season], (err, rows) => {
                if (err) {
                    reject(err);
                    return;
                }

                let maxScore = 0;
                if (rows && rows.length > 0) {
                    for (let row of rows) {
                        let scorePerSecond = Math.abs(row.score) / (row.time / 1000);
                        if (scorePerSecond > maxScore) maxScore = scorePerSecond;
                    }
                }
                resolve(maxScore);
            });
        });
    }

    async getAdminData() {
        return new Promise((resolve, reject) => {
            this.db.all("SELECT * FROM reports", (err, reportRows) => {
                if (err) console.error(err);

                this.db.all("SELECT * FROM leaderboard", (err, leaderboardRows) => {
                    if (err) console.error(err);

                    resolve({
                        reports: reportRows || [],
                        totalGames: leaderboardRows ? leaderboardRows.length : 0,
                        recentGames: leaderboardRows ? leaderboardRows.slice(-500).reverse() : []
                    });
                });
            });
        });
    }

    async adminSignup(username, password) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'INSERT INTO admins (username, password) VALUES (?, ?)',
                [username, password],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }

    async adminLogin(username) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT password FROM admins WHERE username = ?',
                [username],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    async adminApprove(gamecode){
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE leaderboard SET score = ABS(score) where game_code = ?',
                [gamecode],
                (err) => {
                    if (err) reject(err);
                    else resolve();
                }
            );
        });
    }
}