const mqttpress = require("../../lib/mqttpress");
const qs = require("querystring");
const config = require("./config");
const debug = require("./debug")("client");

const mqttname = `${config.mqtt.protocol}://${config.mqtt.host}:${config.mqtt.ports[config.mqtt.protocol]}`;

const query = qs.parse(location.search.substr(1));

const app = mqttpress({prefix: query.prefix});

app.on("connect", ()=>{
  debug(`connected ${app.id} on ${mqttname}`);

  debug(`request: news/sports ${JSON.stringify({winner: "tigers"})}`);
  app.send("news/sports", {winner: "tigers"}).then((data)=>{
    debug(`response: ${JSON.stringify(data)}`);
  }).catch((err)=>{
    console.error(err.stack);
  });

  debug(`request: project/sports/news ${JSON.stringify({loser: "giants"})}`);
  app.send("project/sports/news", {loser: "giants"}).then((data)=>{
    debug(`response: ${JSON.stringify(data)}`);
  }).catch((err)=>{
    console.error(err.stack);
  });
});

app.connect(mqttname);

document.querySelector("#request").addEventListener("click", (ev)=>{
  ev.preventDefault();

  debug(`request: project/sports/news ${JSON.stringify({loser: "giants"})}`);
  app.send("project/sports/news", {loser: "giants"}).then((data)=>{
    debug(`response: ${JSON.stringify(data)}`);
  }).catch((err)=>{
    console.error(err.stack);
  });
});
