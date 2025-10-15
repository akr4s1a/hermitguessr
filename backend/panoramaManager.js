export default class PanoramaManager {
    constructor(panos) {
        this.panos = panos;
        this.userOptions = new Map();
        this.currentPano = new Map();
    }

    initializeUserPanos(userCode, acceptable) {
        let options = Object.keys(this.panos).filter(
            key => acceptable[this.panos[key].season]
        );
        this.userOptions.set(userCode, options);
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