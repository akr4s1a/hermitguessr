import { HGCONFIG } from "../config.js";
let socket;

document.addEventListener("DOMContentLoaded", () => {
    socket = new WebSocket(HGCONFIG.WS_URL);

    socket.onopen = () => {
        socket.addEventListener("message", handleSocketMessage);
        requestDashData(socket)
    };
});

let searchBar = document.querySelector('.search-input')
searchBar.addEventListener('keyup', () => {
    search(searchBar.value)
});
function requestDashData(socket){
            socket.send(JSON.stringify({
            "type": 'admin_dash',
            "token": localStorage.getItem('jwt')
        }))
}
function handleSocketMessage(event) {
    let data = JSON.parse(event.data);

    if (data.type === 'admin_dash') {

        updateStats(data);
        updateGameTable(data.game_list);
        updateInProgressGames(data.in_progress);
    }
    if (data.type === 'refresh') {
        updateToken()
    }
}
function updateToken() {
    fetch('/admin/refresh', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
    }).then((response) => {
        if (response.ok) {
            response.json().then((data) => {
                localStorage.setItem('jwt', data.token);
                requestDashData(socket);
            })

        } else {
            alert('Login failed');
        }
    })
}
function updateStats(data) {
    document.getElementById("total-games").innerHTML = data.total_games + 4682;
    document.getElementById("connected-clients").innerHTML = data.games_list_size;
    document.getElementById("format").innerHTML = `webp: ${data.format_count.webp} - PNG: ${data.format_count.png}`;
    document.getElementById("in-progress-count").innerHTML = `${data.in_progress.length}`;
}

function updateGameTable(gameList) {
    let table = document.querySelector("tbody");
    table.innerHTML = "";

    gameList.forEach((game, index) => {
        let row = table.insertRow();

        let approved = game.score < 0 ? "<div class='btn btn-success'>Approve</div>" : '';

        let cells = [
            index + 1,
            game.username,
            game.score,
            (game.score / (game.time / 1000)).toFixed(2),
            `${(game.time / 1000).toFixed(0)}s`,
            formatDate(game.date),
            game.season,
            game.user_code,
            game.game_code,
            approved,
        ];

        cells.forEach((cellContent, i) => {
            let cell = row.insertCell();
            cell.innerHTML = cellContent;
            if (i === 1) cell.style.fontWeight = 'bold';
        });
    });
    table.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-success')) {
            socket.send(JSON.stringify({
                'type': 'admin_approve',
                'gameCode': e.target.closest('tr').children[8].innerHTML,
                'token': localStorage.getItem('jwt')
            }))
        }
    })
}

function updateInProgressGames(games) {
    let container = document.getElementById("in-progress-games");
    container.innerHTML = "";

    games.forEach(game => {

        let seasonKeys = Object.keys(game.acceptable?.[0] ?? {}).filter(key => game.acceptable?.[0]?.[key]);
        let seasonText = `Season${seasonKeys.length > 1 ? "s" : ""} ${joinWithAnd(seasonKeys)}`;

        let panos = Object.values(game.panos)
            .filter(p => p)
            .map(p => p.panorama);

        let card = createGameCard(game, seasonText, panos.length);
        container.innerHTML += card.outerHTML + "<br>";
    });
}

function createGameCard(game, seasonText, guessCount) {
    let card = document.createElement("div");
    card.className = "card bg-light text-dark me-3 mb-3";
    card.style.minWidth = "25vw";

    let formattedDate = formatDate(game.start.replace(/,/g, ""));

    card.innerHTML = `
        <div class="card-body">
            <div>
                <div class="float-start">
                    <h5 class="card-title">${game.code} (u/${game.user_code})</h5>
                </div>
                <div class="float-end">
                    <p class="card-text">${guessCount} guesses</p>
                </div>
            </div><br>
            <div class="mt-2">
                <div class="float-start">
                    <h6 class="card-subtitle mb-2 text-muted">${formattedDate}</h6>
                </div>
                <div class="float-end">
                    <p class="card-text">${seasonText}</p>
                </div>
            </div>
        </div>
    `;

    return card;
}

function formatDate(dateString) {
    return new Date(parseInt(dateString, 10)).toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function joinWithAnd(arr) {
    return arr.join(", ").replace(/, ([^,]*)$/, ' and $1');
}

function search(text) {
    let rows = document.querySelectorAll('tr')
    for (let i = 1; i < rows.length; i++) {
        if (!rows[i].innerHTML.includes(text)) {
            rows[i].classList.add('d-none')
        } else {
            rows[i].classList.remove('d-none')
        }
    }
}