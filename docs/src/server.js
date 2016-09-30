const mqttpress = require("../../");
const qs = require("querystring");
const uuid = require("uuid");
const config = require("./config");

const debug = require("./debug")("server");

const getPrefix = ()=>{
  const query = qs.parse(location.search.slice(1));
  return query.prefix || undefined;
};

const prefix = getPrefix() || uuid();
const mqttname = `${config.mqtt.protocol}://${config.mqtt.host}:${config.mqtt.ports[config.mqtt.protocol]}`;
const app = mqttpress({prefix});

debug(`add handler to ${"news/#"}`);
app.hear("news/#", ctx =>{
  debug(`hear: ${ctx.topic}, from: ${JSON.stringify(ctx.from)}, data: ${JSON.stringify(ctx.data)}`);
  ctx.send({msg: `congrat ${ctx.data.winner} win!`});
});

debug(`add handler to ${"project/+/news"}`);
app.hear("project/+/news", ctx => {
  debug(`hear: ${ctx.topic}, from: ${JSON.stringify(ctx.from)}, data: ${JSON.stringify(ctx.data)}`);
  ctx.send({msg: `congrat ${ctx.data.loser} lose!`});
});

app.listen(mqttname);
app.on("listening", ()=>{
  debug(`listening ${app.id} on ${mqttname}`);
  document.querySelector("#client_page").href = `./client.html?prefix=${prefix}`;
});

app.on("error", err =>{
  console.error(err.stack);
});
