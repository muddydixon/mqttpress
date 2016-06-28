"use strict";

const mqttpress = require("../lib/mqttpress");
const debug = require("debug")("server");

const app = mqttpress("mqtt://192.168.99.100:1883");

app.hear("news/sports", (res)=>{
  debug(`hear: ${res.topic}, from: ${JSON.stringify(res.from)}, data: ${JSON.stringify(res.data)}`);
  res.send({msg: `congrat newsSports ${res.data.winner} win!`});
});

app.hear("news/#", (res)=>{
  debug(`hear: ${res.topic}, from: ${JSON.stringify(res.from)}, data: ${JSON.stringify(res.data)}`);
  res.send({msg: `congrat ${res.data.winner} win!`});
});

app.hear("project/+/news", (res)=>{
  debug(`hear: ${res.topic}, from: ${JSON.stringify(res.from)}, data: ${JSON.stringify(res.data)}`);
  res.send({msg: `congrat ${res.data.loser} lose!`});
});

app.listen();
app.on("connect", ()=>{
  debug(`listen ${app.id}`);
});

app.on("error", (err)=>{
  console.error(err.stack);
});
