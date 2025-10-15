import { handleGameStart, handleGuessSubmit } from './gameLogic.js';
export class UIElements {
    constructor(state) {
        this.state = state;
        this.elements = {
            imageFormat: "webp",
            choiceSelector: document.getElementById("choiceSelector"),
            audioBtn: document.getElementById("audioBtn"),
            submitBtn: document.getElementById("submitBtn"),
            scoreList: document.getElementById("scoreList"),
            scoreText: document.getElementById("score"),
            startBtn: document.getElementById("startBtn"),
            restartBtn: document.getElementById("restart-game"),
            closeAlertBtn: document.getElementById("close-alert-header"),
            alertHeader: document.getElementById("alert-header"),
            setNameBtn: document.getElementById("set-name-btn"),
            usernameField: document.getElementById("username"),
            submitIssue: document.getElementById("submitIssue"),
            gameCode: document.getElementById("game-code"),
            userCode: document.getElementById("user-code"),
            seasonMenu: document.getElementById("season_menu"),
            clock: document.getElementById("clock"),
            infoToast: document.getElementById("info-toast"),
            infoToastBody: document.getElementById("info-toast-body")
        };

        this.audio = {
            click: document.getElementById("clickA"),
            celebration: document.getElementById("celebrationsA"),
            disagree: document.getElementById("disagreeA"),
            agree: document.getElementById("agreeA"),
            plop: document.getElementById("plopA")
        };
    }

    get(name) {
        return this.elements[name];
    }

    getAudio(name) {
        this.state.audio && this.audio[name].play();
    }

    reset() {
        this.get("scoreText").innerHTML = 'Score: 0';
        this.get("clock").innerHTML = '';

        let submitBtn = this.get("submitBtn");
        submitBtn.disabled = false;
        submitBtn.classList.remove('disabled');

    }
}

export function setupEventListeners(state, dom, socketService, guessHandler) {
    
    dom.get("closeAlertBtn").addEventListener("click", () => {
        localStorage.setItem("headerAlertClose", "true");
    });

    dom.get("setNameBtn").addEventListener("click", () => {
        let usernameField = dom.get("usernameField");
        let setNameBtn = dom.get("setNameBtn");

        if (usernameField.value === "") {
            usernameField.classList.add("is-invalid");
            return;
        }

        localStorage.setItem("username", usernameField.value);
        setNameBtn.classList.add("disabled");
        usernameField.classList.add("disabled");

        setTimeout(() => {
            setNameBtn.classList.remove("disabled");
            usernameField.classList.remove("disabled");
        }, 1000);
    });

    dom.get("audioBtn").addEventListener("click", () => {
        state.audio = !state.audio;
        localStorage.setItem("audio", state.audio);

        let audioBtn = dom.get("audioBtn");
        dom.getAudio("click");
        audioBtn.textContent = `Sounds are ${state.audio ? "on" : "off"}`;
    });

    dom.get("startBtn").addEventListener("click", () => {
        handleGameStart(state, dom, socketService, guessHandler);
    });

    dom.get("submitBtn").addEventListener("click", () => {
        handleGuessSubmit(state, dom, socketService, guessHandler);
    });

}
export function showTemporaryMessage(dom, message, duration = 3000) {
    let toastEl = dom.get("infoToast")
    dom.get("infoToastBody").textContent = message;
    toastEl.dataset.bsDelay = duration;

    let toast = bootstrap.Toast.getOrCreateInstance(toastEl);
    toast.show();
}

export function hideTemporaryMessage(dom){
    bootstrap.Toast.getOrCreateInstance(dom.get("infoToast")).hide();
}

export function setupSeasonMenu() {
    let seasonMenu = document.getElementById("season_menu");

    seasonMenu.addEventListener("click", (e) => e.stopPropagation());

    document.querySelectorAll("#season_menu .dropdown-item").forEach(el => {
        el.addEventListener("click", (e) => {
            if (e.target.tagName !== "A" && e.target.tagName !== "DIV") return;
            e.stopPropagation();

            let checkbox = el.querySelector("input[type='checkbox']");
            checkbox.checked = !checkbox.checked;
        });
    });

    document.querySelectorAll('#season_menu input[type="checkbox"]').forEach(el => {
        el.addEventListener("click", (e) => {
            e.stopPropagation();
            el.parentElement.querySelector("label").click();
        });
    });
}

export function loadLocalSettings(state, dom) {
    if (localStorage.getItem("headerAlertClose") !== null) {
        let alertHeader = dom.get("alertHeader");
        // alertHeader.classList.remove("show");
        // alertHeader.style.display = "none";
    }

    if (localStorage.getItem("username") !== null) {
        dom.get("usernameField").value = localStorage.getItem("username");
    }

    if (localStorage.getItem("season") !== null) {
        let season = JSON.parse(localStorage.getItem("season"));
        document.querySelectorAll('input[type="checkbox"]').forEach(el => {
            el.checked = season.includes(el.value);
        });
    }

    if (localStorage.getItem("audio") !== null) {
        state.audio = localStorage.getItem("audio") === "true";
        dom.get("audioBtn").innerHTML = state.audio ? "Sounds are on" : "Sounds are off";
    }
}
