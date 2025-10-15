
import { HGCONFIG } from '../modules/config.js';

const MARKER_ICONS = {
    colours: ['violet', 'blue', 'green', 'gold', 'red'],
    baseUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    size: [25, 41],
    anchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
};


class MarkerIconFactory {
    static createIcon(guessNumber) {
        const colour = MARKER_ICONS.colours[guessNumber];
        return new L.Icon({
            iconUrl: `${MARKER_ICONS.baseUrl}/marker-icon-2x-${colour}.png`,
            shadowUrl: MARKER_ICONS.shadowUrl,
            iconSize: MARKER_ICONS.size,
            iconAnchor: MARKER_ICONS.anchor,
            popupAnchor: MARKER_ICONS.popupAnchor,
            shadowSize: MARKER_ICONS.shadowSize
        });
    }

    static createAllIcons(maxGuesses = 5) {
        const icons = {};
        for (let i = 0; i < maxGuesses; i++) {
            icons[i] = this.createIcon(i);
        }
        return icons;
    }
}


class GuessStateManager {
    constructor(maxGuesses = 5) {
        this.maxGuesses = maxGuesses;
        this.currentGuessNumber = 0;
        this.reset();
    }

    reset() {
        this.guessed = {};
        this.guesses = [];
        this.guessCoords = [];
        this.currentGuessNumber = 0;
        this.finalMark = null;
        this.finalLine = null;

        for (let i = 0; i < this.maxGuesses; i++) {
            this.guessed[i] = false;
        }
    }

    hasGuessed(guessNumber) {
        return this.guessed[guessNumber] === true;
    }

    markAsGuessed(guessNumber) {
        this.guessed[guessNumber] = true;
    }

    setGuess(guessNumber, marker) {
        this.guesses[guessNumber] = marker;
    }

    getGuess(guessNumber) {
        return this.guesses[guessNumber];
    }

    setCoords(coords) {
        this.guessCoords = coords;
    }

    getCoords() {
        return this.guessCoords;
    }

    clearTemporaryMarkers(map) {
        if (this.finalMark) {
            map.removeLayer(this.finalMark);
            this.finalMark = null;
        }
        if (this.finalLine) {
            map.removeLayer(this.finalLine);
            this.finalLine = null;
        }
    }

    clearAllMarkers(map) {
        this.guesses.forEach((marker, index) => {
            if (marker && map.hasLayer(marker)) {
                map.removeLayer(marker);
            }
        });
        
        this.clearTemporaryMarkers(map);
    }

    incrementGuessNumber() {
        if (this.currentGuessNumber < this.maxGuesses) {
            this.currentGuessNumber++;
        }
    }
}


class GuessUIManager {
    constructor(containerId = "guess-move-div") {
        this.containerId = containerId;
    }

    updateCoordinateDisplay(coords) {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        const [x, z, y] = coords.map(Math.round);

        container.innerHTML = `
            <div class="btn-group" role="group">
                <button type="button" class="btn btn-light" coord="${x}" id="xguess">
                    X: ${x}
                </button>
                <button type="button" class="btn btn-light" coord="${z}" id="zguess">
                    Z: ${z}
                </button>
                <button type="button" class="btn btn-light">
                    Y: ${y}
                </button>
            </div>
        `;
    }

    clearDisplay() {
        const container = document.getElementById(this.containerId);
        if (container) {
            container.innerHTML = '';
        }
    }
}


class GuessHandler extends BaseControl {
    constructor(state, dom) {
        super("GuessHandler");
        this.state = state;
        this.dom = dom;
        this.guessState = new GuessStateManager(HGCONFIG?.MAX_GUESSES || 5);
        this.guessUI = new GuessUIManager();
        this.icons = MarkerIconFactory.createAllIcons(this.guessState.maxGuesses);
        this.map = null;
    }

    create(wrapper) {
        const container = document.createElement("span");
        container.setAttribute("id", "guess-move-div");
        wrapper.appendChild(container);

        if (this.ui?.lmap) {
            this.map = this.ui.lmap;
            this.map.on("click", (e) => this.handleMapClick(e));
        }
    }

    handleMapClick(event) {

        const submitBtn = document.getElementById("submitBtn");
        if (submitBtn?.disabled) {
            return;
        }


        this.guessState.clearTemporaryMarkers(this.map);

        const currentGuess = this.state.guessCount;

        const coords = this.ui.latLngToMC(event.latlng, 64);


        this.dom?.getAudio("plop");


        if (this.guessState.hasGuessed(currentGuess)) {
            const existingMarker = this.guessState.getGuess(currentGuess);
            if (existingMarker) {
                this.map.removeLayer(existingMarker);
            }
        }

        const marker = new L.marker(event.latlng, {
            icon: this.icons[currentGuess]
        }).addTo(this.map);


        this.guessState.markAsGuessed(currentGuess);
        this.guessState.setGuess(currentGuess, marker);
        this.guessState.setCoords(coords);


        this.guessUI.updateCoordinateDisplay(coords);
    }

    getName() {
        return 'guess-pos';
    }

    reset() {
        if (this.map) {
            this.guessState.clearAllMarkers(this.map);
        }
        
        this.guessState.reset();
        this.guessUI.clearDisplay();
    }


    getGuessCoords() {
        return this.guessState.getCoords();
    }

    getGuessMarker(guessNumber) {
        return this.guessState.getGuess(guessNumber);
    }

    hasGuessed(guessNumber) {
        return this.guessState.hasGuessed(guessNumber);
    }

    incrementGuess() {
        this.guessState.incrementGuessNumber();
    }
}



export const guessIcons = MarkerIconFactory.createAllIcons();
export const guessed = {};
export const guesses = [];

export function createGuessHandler(state, dom) {
    return new GuessHandler(state, dom);
}