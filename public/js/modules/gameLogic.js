import { HGCONFIG } from './config.js';
import { guessIcons } from '../Leaflet/guessHandler.js';
import { showTemporaryMessage } from './uiHandler.js';



export function updateScore(data, state, dom) {
    
    document.querySelectorAll('.scoreListItem')[state.guessCount].innerHTML = `${data.score}pts (${data.distance} ${data.distance === 1 ? 'block' : 'blocks'})`;
    state.score += data.score;

    if (data.score > 95 && state.audio) {
        dom.getAudio("agree");
    }

    dom.get("scoreText").innerHTML = `Score: ${state.score}`;
}

export function updateMap(data, state, dom) {
    let ans = data.ans;
    let answerMarker = new L.marker(
        Mapcrafter.mcToLatLng(ans.x, ans.z, 64),
        { icon: guessIcons[state.guessCount] }
    ).addTo(Mapcrafter.lmap);

    let line = new L.polyline(
        [
            Mapcrafter.mcToLatLng(ans.x, ans.z, 64),
            Mapcrafter.mcToLatLng(
                state.x,
                state.z,
                64
            )
        ],
        { color: "red" }
    ).addTo(Mapcrafter.lmap);

    state.seasonIcons[state.seasonNum].push(answerMarker, line);
}

export function handleGameOver(data, state, dom) {
    clearInterval(state.startInterval);

    let scoreText = dom.get("scoreText");
    let submitBtn = dom.get("submitBtn");

    scoreText.innerHTML = `Score: ${state.score} (${(state.score / ((Date.now() - state.startTime) / 1000)).toFixed(2)} score per second)`;
    submitBtn.disabled = true;
    if (showTemporaryMessage) {
        showTemporaryMessage(dom, "Game over!");
    }

    if (data.high_score === true) {
        if (showTemporaryMessage) {
            showTemporaryMessage(dom, "New High Score!", 5000);
        }
        dom.getAudio("celebration");
        triggerConfetti();
    }

    let startBtn = dom.get("startBtn")
    startBtn.disabled = false;
    startBtn.innerHTML = `Play Again`;
}

export function triggerConfetti() {
    let duration = HGCONFIG.CONFETTI_DURATION;
    let animationEnd = Date.now() + duration;
    let defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    let interval = setInterval(() => {
        let timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
            return clearInterval(interval);
        }

        let particleCount = 25 * (timeLeft / duration);
        let randomInRange = (min, max) => Math.random() * (max - min) + min;

        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        }));
        confetti(Object.assign({}, defaults, {
            particleCount,
            origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        }));
    }, 10);
}

export function loadPanorama(data, state, dom) {
    let submitBtn = dom.get("submitBtn")
    submitBtn.classList.remove('disabled');
    submitBtn.disabled = state.guessCount >= HGCONFIG.MAX_GUESSES;

    if (state.startTime === null) {
        state.startTime = Date.now();
        state.startInterval = setInterval(() => {
            if (state.startTime !== null) {
                let time = Date.now() - state.startTime;
                dom.get("clock").innerHTML = `${(time / 1000).toFixed(1)} seconds`;
            }
        }, 50);
    }

    let prevSeason = state.seasonNum;
    state.seasonNum = data.season;

    Mapcrafter.setMap(
        Mapcrafter.getMapConfigsOrder()[HGCONFIG.SEASON_MAPPINGS[state.seasonNum]]
    );

    pannellum.viewer('panorama', {
        type: "equirectangular",
        panorama: `${HGCONFIG.PANO_BASE_URL}/season${state.seasonNum}/${data.panorama}`,
        autoLoad: true,
    });

    state.panorama = data.panorama;

    if (prevSeason !== state.seasonNum) {
        updateSeasonIcons(prevSeason, state.seasonNum, state);
    }
}

export function updateSeasonIcons(prevSeason, newSeason, state) {
    Object.keys(state.seasonIcons).forEach(season => {
        if (parseInt(season) !== newSeason) {
            state.seasonIcons[season].forEach(icon => {
                Mapcrafter.lmap.removeLayer(icon);
            });
        }
    });

    state.seasonIcons[newSeason].forEach(icon => {
        Mapcrafter.lmap.addLayer(icon);
    });
}


export function handleGameStart(state, dom, socketService, guessHandler) {
    if (state.guessCount >= HGCONFIG.MAX_GUESSES){
        handleReset(state, dom, socketService, guessHandler);
        window.dispatchEvent(new CustomEvent('gameReset'));
    }else{
        startGame(dom, socketService);
    }
    document.querySelectorAll('.scoreListItem').forEach(el=>{el.innerHTML=''});
    dom.get("startBtn").classList.add('me-5')
    dom.get("startBtn").disabled = true;
    dom.get('scores').classList.remove('d-none')
    dom.get("reportBtn").classList.remove('d-none');
    dom.get("mcmap").classList.remove('d-none');
    dom.get("panorama").classList.remove('d-none');
    dom.get("season_dropdown").classList.add('d-none');
    dom.get("submitBtn").classList.remove('d-none');
    dom.get("submitBtn").classList.add('disabled');
    dom.get("setNameBtn").classList.add('d-none');
    dom.get('username_label').classList.add('d-none');
}

export function startGame(dom, socketService) {
    let usernameField = dom.get("usernameField");
    if (usernameField.value && localStorage.getItem("username")) {
        socketService.send({ type: "setName", username: usernameField.value });
    }
    usernameField.classList.add('d-none');

    if (window.location.pathname === "/beta") {
        socketService.send({ type: "beta", code: localStorage.getItem("usercode") });
    }
    let acceptable = [];
    document.querySelectorAll('input[type="checkbox"]').forEach(el => {
        if (el.checked) acceptable.push(el.value);
    });
    localStorage.setItem("season", JSON.stringify(acceptable));
    
    socketService.send({
        type: "startGame",
        acceptable: acceptable,
        user_code: localStorage.getItem("user_code"),
        format: dom.get("imageFormat").innerHTML
    });
}

export function clearAllSeasonIcons(state) {
    Object.keys(state.seasonIcons).forEach(season => {
        state.seasonIcons[season].forEach(icon => {
            if (Mapcrafter.lmap && Mapcrafter.lmap.hasLayer(icon)) {
                Mapcrafter.lmap.removeLayer(icon);
            }
        });
        state.seasonIcons[season] = [];
    });
}

export function handleReset(state, dom, socketService, guessHandler) {
    dom.reset();
    guessHandler.reset();
    clearAllSeasonIcons(state);
    startGame(dom, socketService);
}

export function handleGuessSubmit(state, dom, socketService, guessHandler) {
    let submitBtn = dom.get("submitBtn");
    submitBtn.classList.add("disabled");
    submitBtn.disabled = true;

    setTimeout(() => {
        submitBtn.classList.remove('disabled');
        submitBtn.disabled = state.guessCount >= HGCONFIG.MAX_GUESSES;
    }, 150);

    if (!guessHandler.hasGuessed(state.guessCount)) {
        dom.getAudio("disagree");
        if (showTemporaryMessage) {
            showTemporaryMessage(dom, "Make a guess first");
        }
        return;
    }

    let coords = guessHandler.getGuessCoords();

    socketService.send({
        type: "choice",
        panorama: state.panorama,
        choice: {
            x: Math.round(coords[0]),
            z: Math.round(coords[1])
        }
    });

    state.x = Math.round(coords[0]);
    state.z = Math.round(coords[1]);

    let marker = guessHandler.getGuessMarker(state.guessCount);
    if (marker) {
        state.seasonIcons[state.seasonNum].push(marker);
    }
}