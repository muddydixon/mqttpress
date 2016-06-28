"use strict";

const mqttpress = require("../lib/mqttpress");
const debug = require("debug")("client");

const app = mqttpress("mqtt://192.168.99.100:1883");
app.connect();
app.on("connect", ()=>{
  debug(`connection ready ${app.id}`);

  debug(`send:`);
  app.send("news/sports", {winner: "tigers"}).then((data)=>{
    debug(`resv: ${JSON.stringify(data)}`);
  }).catch((err)=>{
    console.error(err.stack);
  });

  app.send("project/sports/news", {loser: "giants"}).then((data)=>{
    debug(`resv: ${JSON.stringify(data)}`);
  }).catch((err)=>{
    console.error(err.stack);
  });
});
