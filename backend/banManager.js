import Filter from 'bad-words'
import GameUtils from './gameUtils.js'
import fs from 'fs/promises'
export default class BanManager {
    constructor(dbManager, bannedData) {
        this.dbManager = dbManager;
        this.bannedIPs = bannedData.banned_ips || [];
        this.bannedUsers = bannedData.banned_users || [];
        this.filter = new Filter();
    }

    isIPBanned(ip) {
        return this.dbManager.isBanned(ip) || this.bannedIPs.includes(ip)
    }

    isUserCodeBanned(userCode) {
        return this.dbManager.isBanned(userCode) || this.bannedUsers.includes(userCode)
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