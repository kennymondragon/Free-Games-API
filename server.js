const express = require('express');
const app = express();
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

let allowedOrigins = ['*', 'http://*', 'https://*', 'http://localhost:3000', 'https://freegames.vtsxcode.xyz', 'https://freegamestracker.pages.dev'];
let gamesData = ""
let todaysDate = ""

app.use('/thumbnails', express.static(`thumbnails`))
app.use(express.json());
app.use(cors({
    origin: function(origin, callback) {
        console.log(origin);
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) === -1) {
            let message = 'The CORS policy for this site does not allow access from the specidied Origin.';
            return callback(new Error(message), false);
        }
        return callback(null, true);
    },
    methods: ['GET', 'POST'],
    credentials: true
}));

app.get("/getGames", (req, res) => {
    if (todaysDate != getTodayDate()) {
        console.log("Does not match todays date...");
        todaysDate = getTodayDate();
        gamesData = readFile(todaysDate);
        test = gamesData;
        test.forEach(elem => {
            downloadThumbnail(elem["game"]["image"]["url"], `${__dirname}/thumbnails/${elem["game"]["image"]["url"].split('/')[elem["game"]["image"]["url"].split('/').length-1]}`);
            elem["game"]["image"]["url"] = `https://games.vtsxcode.xyz/thumbnails/${elem["game"]["image"]["url"].split('/')[elem["game"]["image"]["url"].split('/').length-1]}`;
        });
        fs.writeFile(`${__dirname}/data/${todaysDate}.json`, JSON.stringify(test), err => {
            if (err) {
              console.error(err);
              todaysDate = "";
            }
        });
    }
    else if (gamesData == undefined || gamesData == "" || gamesData == " ") {
        console.log("Gamedata is empty...");
        gamesData = readFile(todaysDate);
        test = gamesData;
        test.forEach(elem => {
            downloadThumbnail(elem["game"]["image"]["url"], `${__dirname}/thumbnails/${elem["game"]["image"]["url"].split('/')[elem["game"]["image"]["url"].split('/').length-1]}`);
            elem["game"]["image"]["url"] = `https://games.vtsxcode.xyz/thumbnails/${elem["game"]["image"]["url"].split('/')[elem["game"]["image"]["url"].split('/').length-1]}`;
        });
        fs.writeFile(`${__dirname}/data/${todaysDate}.json`, JSON.stringify(test), err => {
            if (err) {
              console.error(err);
              todaysDate = "";
            }
        });
    }

    let limit = req.query.limit;
    let title = req.query.title;
    let type = req.query.type;
    let platform = req.query.platform;
    let result = gamesData;

    if (type != undefined && (type != "" || type != " ")) {
        type = type.toLowerCase();
        console.log("filtering by isFree...");
        result = result.filter(obj => obj["type"].toLowerCase() == type);
    }
    if (platform != "" && platform != undefined)
    {
        platform = platform.toLowerCase();
        console.log("filtering by platform...");
        result = result.filter(obj => obj["platforms"].some((e) => e["name"].toLowerCase() == platform));
    }
    if (title != undefined && (title != "" || title != " ")) {
        title = title.toLowerCase();
        result = result.filter(obj => obj["game"]["title"].toLowerCase() == title);
    }

    res.send(result);
});

function getTodayDate() {
    let date_obj = new Date();
    return `${date_obj.getDay()}-${date_obj.getMonth()}-${date_obj.getFullYear()}`
}

function readFile(filename) {
    console.log(`Reading ${filename}...`);

    if (!fs.existsSync(`${__dirname}/data/${filename}.json`)) getGameData();

    try {
        let data = fs.readFileSync(`D:/GitHub/FreeGamesAPI/data/${filename}.json`, 'utf8');
        return JSON.parse(data);
    }
    catch (err) {
        console.log(`ERROR: ${err.message}`);
    }
    return;
}

function getGameData() {
    axios.get('https://gx-proxy.operacdn.com/content/free-games').then(response => {
        todaysDate = getTodayDate();
        fs.writeFile(`${__dirname}/data/${todaysDate}.json`, JSON.stringify(response.data), err => {
            if (err) {
              console.error(err);
              todaysDate = "";
            }
        });
      }).catch(error => {
        console.log(error);
    });
    return;
}

function downloadThumbnail(url, path) {
    console.log(url);
    console.log(path);
    let responseSuccess = false;
    let response = axios({url, method: 'GET', responseType: 'stream'}).then((res) => {
        res.data.pipe(fs.createWriteStream(path));
        responseSuccess = true;
    }).catch(error => {
        console.log(error);
    });

    if (!responseSuccess) {
        response = axios({url, method: 'GET', responseType: 'stream'}).then((res) => {
            res.data.pipe(fs.createWriteStream(path));
            responseSuccess = true;
        }).catch(error => {
            console.log(error);
        });
    }
    return response;
}

app.listen(9085, () => console.log('alive on http://localhost:9085'));