import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'
import localServerConfig from '../localServerConfig.json' with { type: 'json'};
const salt_rounds = 10;
const jwt_expires = localServerConfig.JWT_AGE



export default class AuthHandler {
    constructor(gameManager) {
        this.gameManager = gameManager;
        this.secret = localServerConfig.JWT_SECRET || 'dev_secret_key';
    }

    async handleLogin(username, password) {
        try {
            let row = await this.gameManager.dbManager.adminLogin(username);
            if (!row) {
                console.log('User not found');
                return false;
            }

            let storedHash = row.password;
            let result = await bcrypt.compare(password, storedHash);

            if (!result) {
                return null;
            }
            let token = jwt.sign(
                { username },
                this.secret,
                { expiresIn: jwt_expires }
            )
                console.log(`Admin ${username} logged in`)
                return token;
                
        } catch (err) {
            console.error('Login error:', err);
            return false;
        }
    }

    async handleSignup(username, password) {
        try {
            let hash = await bcrypt.hash(password, salt_rounds);
            await this.gameManager.dbManager.adminSignup(username, hash);
            console.log(`Created admin ${username}`);
            return true;
        } catch (err) {
            console.error('Signup error:', err);
            return false;
        }
    }

    verify(token){
        try{
            let verified = jwt.verify(
                token, 
                this.secret
            )
            return verified
        }catch (err){
            console.warn(`Token failed ${err}`)
            return null;
        }
    }
}
