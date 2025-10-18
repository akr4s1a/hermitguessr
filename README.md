# HermitGuessr

HermitGuessr is a fan project, not affiliated with HermitCraft. It is a geoguessr style game where you select a season and are randomly given five 360° images and you must guess where these were taken on the map.

This project uses pannellum to display the panoramas, Mapcrafter and Leaflet for the map. 

<!-- TOC -->

- [Local Instance](#running-a-local-instance)
- [Custom Maps](#customing)
- [Adding locations](#community-contributions)

<!-- /TOC -->


## Running a local instance

I have only verified this on Linux.

- Clone the repository

    `git clone https://github.com/akr4s1a/hermitguessr.git`

- Install NVM

    ` https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating `

- Install Node 18 or later

    ` nvm install 24 && nvm use 24`

- Install build packages

    `sudo apt install -y build-essential make g++ gcc` for example
- Install Node packages

    `npm i`

- Create a Local config

    localServerConfig.json
    ```
    {
        "port": 3000 // Port the webapp will run on
        "JWT_SECRET": "", // openssl rand -base64 32
        "JWT_REFRESH_SECRET": "", // openssl rand -base64 32
        "JWT_AGE": 150000, // Expiry time in ms (15m)
        "SECURE_ENV": true // Whether the server is running behind a load balancer that handles TLS or not. Set to false for local development 
    }
    ```
 
- Create a banlist

    banned.json
    ```
    {
    "banned_users":[],
    "banned_ips":[]
    }
    ```

-  Modify the front-end configuration

    In `public/js/modules/config.js`, you will need to change `WS_URL` and `PANO_BASE_URL` to your own. You can use `[ip]:[port]` if you are not using a domain

- Run the server

    `node main.js`

If you do as configured, you'll have a local backend but still be using HermitGuessr.ca's front-end assets. 

## Customing

I have received a lot of requests over the years for people wanting to make their own versions for different maps. This section is an overview of the work required.

- Use MapCrafter to generate the map

    I recommend miclav's fork
    https://github.com/miclav/mapcrafter and https://hub.docker.com/r/miclav/mapcrafter

- Point leaflet at your own map

    Modify the `cdnurl` in `public/js/Leaflet/mapcrafterui.js` to point to your own CDN or web server serving the leaflet tiles. 

- Configure the Season mappings

    in `public/js/modules/config.js` you will need modify the `season_mappings`, it's a kv pair, the key is the season name and the value is the entry in the map configuration `public/js/Leaflet/mapConfig.js:CONFIG.mapsOrder[]`
    The key is the season name and the value is the index of the mapOrder array in the Mapcrafter map config. Keep these values in mind for step 4, 5 and 6. 

- Adjust the maps

    On the backend, the variable controlling which map is selected is acceptable. 

    in `backend/messageHandler.js` you will need to modify the acceptable variable to include the name of the new map as well as the `no_acceptable` packet 

    In `index.html` you will need to modify the season dropdown to only include your maps. N.B. the value of the input is the key from the season_mapping in Step 3. 

- Capture equirectangular screenshots. 

    To create the panoramas, you will need to capture equirectangular photos of the locations you want to use. Then place them in public/images/panos/season$mapsOrderIndex where mapsOrderIndex is the value from the season_mapping in Step 3.

- Modify panos.json

    `panos.json` contains a mapping of each panorama's filename (must be unique across seasons) and it's coordinate and season. 
    Each entry should look like `"filename.extension":{"x":[xCoordinate],"z":[zCoordinate],"season":[keyValueOfSeasonMappings]}`
    Where key is from the `season_mappings` of step 3 which corresponds to its index in the `mapOrder` array.

    `panos.json` is loaded at runtime and its file names are randomised.

- Setup admin access

    While the signup method exists, it's not called anywhere in the code. If you are running a local instance and want to see the admin dash, you can change the handleLogin to handleSignup, sign up, and revert this change.


## Community Contributions
At the moment, I am not taking community contributions for locations. At some point in the future I may release a mod to decomplicate the process and allow them.