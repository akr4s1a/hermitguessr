import fs from 'fs'
import path from 'path'
import GameUtils from './gameUtils.js'

export default class PanoramaManager {
    constructor(panos) {
        this.originPanos = panos;
        this.panos = {}
        this.userOptions = new Map();
        this.currentPano = new Map();
        this.shuffle(this.originPanos)
    }

    initializeUserPanos(userCode, acceptable) {
        let options = Object.keys(this.panos).filter(
            key => acceptable[this.panos[key].season]
        );
        this.userOptions.set(userCode, options);
    }
    shuffle(panos){
       let tempDir = path.join('public/images/tmp')
        if (fs.existsSync(tempDir)){
            let files = fs.readdirSync(tempDir)
            files.forEach(file => {
                let tempFile = path.join(tempDir,file)
                if (fs.statSync(tempFile).isDirectory()){
                    fs.rmSync(tempFile, { recursive: true, force: true })
                }
            });
        } else {
            fs.mkdirSync(tempDir)
        }

        for (let panoFileName in panos){
            let panoData = panos[panoFileName];
            let newPath = path.join(tempDir, `season${panoData.season}`)
            if (!fs.existsSync(newPath)){ fs.mkdirSync(newPath, { recursive: true } )}
            let originalPath = path.join('public','images','panos',`season${panoData.season}`,panoFileName)
            let randomName = GameUtils.generateCode() + '.webp'
            let symlinkPath = path.join(newPath, `${randomName}`);

            let relativeTarget = path.relative(path.dirname(symlinkPath), originalPath);
            fs.symlinkSync(relativeTarget, symlinkPath);
            this.panos[randomName] = panoData;
        }
        console.log("Panoramas randomised")
    }
    getRandomPano(userCode, acceptable) {
        let options = this.userOptions.get(userCode) || [];

        if (options.length === 0) {
            this.initializeUserPanos(userCode, acceptable);
            options = this.userOptions.get(userCode);
        }

        let idx = Math.floor(Math.random() * options.length);
        let panoKey = options[idx];
        let pano = this.panos[panoKey];

        this.currentPano.set(userCode, panoKey);
        this.userOptions.set(userCode, options.filter((_, i) => i !== idx));

        return { key: panoKey, season: pano.season, coords: { x: pano.x, z: pano.z } };
    }

    getCurrentPano(userCode) {
        let key = this.currentPano.get(userCode);
        return key ? this.panos[key] : null;
    }
}