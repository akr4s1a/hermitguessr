import {
    updateScore,
    updateMap,
    handleGameOver, 
    loadPanorama ,
} from './gameLogic.js'
import { showTemporaryMessage } from './uiHandler.js'

export let handlers = {
    code: (data, state, dom) => {
        dom.get("gameCode").innerHTML = data.code;
    },

    user_code: (data, state, dom) => {
        dom.get("userCode").innerHTML = data.code;
        localStorage.setItem("user_code", data.code);
    },

    no_acceptable: () => {
        if (confirm("You have not selected any seasons")) {
            window.location.reload();
        }
    },

    guessAnswer: (data, state, dom) => {
        updateScore(data, state, dom);
        updateMap(data, state, dom);
        state.guessCount++;
    },

    banned: (data, state, dom) => {
        localStorage.removeItem("username");
        let setNameBtn = dom.get("setNameBtn");
        let usernameField = dom.get("usernameField");

        setNameBtn.disabled = true;
        usernameField.disabled = true;
        usernameField.value = "";

        let banned = document.getElementById("banned");
        let bannedToast = new bootstrap.Toast(banned);
        bannedToast.show();
    },

    hard_banned: () => {
        alert("You have been banned from this game. Please contact akr4s1a for more information.");
    },

    gameOver: (data, state, dom) => {
        handleGameOver(data, state, dom);
    },

    panorama: (data, state, dom) => {
        loadPanorama(data, state, dom);
    },


    timeout: (data, state, dom) => {
        if (showTemporaryMessage) {
            showTemporaryMessage(dom, "Connection Lost!", 20000);
        }
        dom.get("submitBtn").disabled = true;
    }
};

