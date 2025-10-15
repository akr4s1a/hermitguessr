import Filter from 'bad-words'
import GameUtils from './gameUtils.js'
import fs from 'fs/promises'
export default class BanManager {
    constructor(db, bannedData) {
        this.db = db;
        this.bannedIPs = bannedData.banned_ips || [];
        this.bannedUsers = bannedData.banned_users || [];
        this.filter = new Filter();
    }

    async isIPBanned(ip) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM banned', (err, rows) => {
                if (err) {
                    console.error(err);
                    resolve(false);
                    return;
                }
                let dbBans = rows.map(x => x.banned);
                resolve([...this.bannedIPs, ...dbBans].includes(ip));
            });
        });
    }

    async isUserCodeBanned(userCode) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM banned', (err, rows) => {
                if (err) {
                    console.error(err);
                    resolve(false);
                    return;
                }
                let dbBans = rows.map(x => x.banned);
                resolve(dbBans.includes(userCode));
            });
        });
    }

    isUsernameBanned(username) {
        if (this.filter.isProfane(username)) return true;

        for (let ban of this.bannedUsers) {
            if (GameUtils.levenshtein(username, ban) < 2) {
                return true;
            }
        }
        return false;
    }

    async logBan(data) {
        let filename = `./logs/${data.id || 'unknown'}-${GameUtils.generateCode()}.json`;
        try {
            await fs.writeFile(filename, JSON.stringify({
                ...data,
                date: new Date().toLocaleString()
            }));
        } catch (err) {
            console.error('Log write error:', err);
        }
    }
}