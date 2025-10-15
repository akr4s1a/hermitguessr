
fetch("/leaderboard_data")
    .then(response => response.json())
    .then(data => {
        let table_body = document.getElementById("leaderboard-body");
        data = data.slice(0, 25)
        for (let i = 0; i < data.length; i++) {
            let row = document.createElement("tr");
            let rank = document.createElement("td");
            let username = document.createElement("td");
            let score = document.createElement("td");
            let time = document.createElement("td");
            rank.innerHTML = i + 1;
            username.innerHTML = data[i].username;
            score.innerHTML = (data[i].score / (data[i].time / 1000)).toFixed(2);
            row.appendChild(rank);
            row.appendChild(username);
            row.appendChild(score);
            table_body.appendChild(row);
        }
    });