fetch("/leaderboard_data")
    .then(response => response.json())
    .then(d => {
        let data = d['leaderboard']
        document.getElementById("data-time").innerHTML = `Data as of ${new Date(d['timestamp']).toLocaleString()}`
        document.getElementById("loader-spinner").style.display = "None";
        document.getElementById("table-tab").style.display = "block"
        let leaderboards = {
            all: {},
            allSeasons: {},
            mixed: {},
            s4: {},
            s5: {},
            s6: {},
            s7: {},
            s8: {},
            s9: {},
            s10: {}
        };
        data.forEach(entry => {
            let username = entry.username;
            let score = entry.score / (entry.time / 1000);
            let season = entry.season;
            if (!leaderboards.all[username] || leaderboards.all[username].score < score) {
                leaderboards.all[username] = { score, season };
            }
            if (season == "Seasons 4, 5, 6, 7, 8, 9 and 10") {
                if (!leaderboards.allSeasons[username] || leaderboards.allSeasons[username].score < score) {
                    leaderboards.allSeasons[username] = { score, season };
                }
            }
            if (/^\D*\d\D+\d\D*$/.test(season)) {
                if (!leaderboards.mixed[username] || leaderboards.mixed[username].score < score) {
                    leaderboards.mixed[username] = { score, season };
                }
            }
            for (let i = 4; i <= 10; i++) {
                if (season.includes(i.toString()) && season.includes("Season ")) {
                    if (!leaderboards['s' + i][username] || leaderboards['s' + i][username].score < score) {
                        leaderboards['s' + i][username] = { score, season };
                    }
                }
            }
        });

        let appendRow = (tableBodyId, username, score, season, rank) => {
            let table_body = document.getElementById(tableBodyId);
            let row = document.createElement("tr");
            let rankCell = document.createElement("td");
            let usernameCell = document.createElement("td");
            let scoreCell = document.createElement("td");
            let seasonCell = document.createElement("td");
            rankCell.innerHTML = rank;
            usernameCell.innerHTML = username;
            scoreCell.innerHTML = score.toFixed(2);
            seasonCell.innerHTML = season;
            row.appendChild(rankCell);
            row.appendChild(usernameCell);
            row.appendChild(scoreCell);
            row.appendChild(seasonCell);
            table_body.appendChild(row);
        };

        Object.keys(leaderboards).forEach(key => {
            let sortedUsernames = Object.entries(leaderboards[key])
                .sort((a, b) => b[1].score - a[1].score)
                .slice(0, 25);
            for (let i = 0; i < sortedUsernames.length; i++) {
                appendRow(`${key}-leaderboard-body`, sortedUsernames[i][0], sortedUsernames[i][1].score, sortedUsernames[i][1].season, i + 1);
            }
        });
    });
