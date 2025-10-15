export class GameState {
    constructor() {
        this.socket = null;
        this.panorama = "";
        this.startTime = null;
        this.startInterval = null;
        this.seasonNum = 8;
        this.score = 0;
        this.guessCount = 0;
        this.audio = localStorage.getItem("audio") === "true";
        this.seasonIcons = {
            4: [], 5: [], 6: [], 7: [], 8: [], 9: [], 10: []
        };
    }

    reset() {
        this.startTime = null;
        this.score = 0;
        this.guessCount = 0;
        this.panorama = "";
        this.seasonNum = 8;
        clearInterval(this.startInterval);
    }
}
