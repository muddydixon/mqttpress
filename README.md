mqttpress
-----

MQTTPRESS is another Serverless Architecture using MQTT Broker.


```
+--------+
|  MQTT  |
+--------+
 |  |   |
 |  |   +--------------------------------------+
 |  |                                          |
 |  +------------------+                       |
 |                     |                       |
+---------------+    +-------------------+    +------------------+
|  Server Page  |    |  Client Page (1)  |    |  Client Page (2) |
+---------------+    +-------------------+    +------------------+

emulates this!

+---------------+               +---------------+
|  Client Page  |------Req----->|  Server Page  |
|      (1)      |<-----Res------|               |
+---------------+	            |               |
                                |               |
+---------------+               |               |
|  Client Page  |------Req----->|               |
|      (2)      |<-----Res------|               |
+---------------+	            +---------------+
```

## Requirements

* node.js (>= 6)
* mqtt broker (on either your server or cloud like [NIFTY Cloud](http://cloud.nifty.com/service/mqtt.htm) or [CloudMQTT](https://www.cloudmqtt.com/))

## Demo

1. Open [Server Page](https://muddydixon.github.io/mqttpress/server.html)
1. Click "Client Page" button to open Client page corresponding to the Server Page.
1. Check console of both pages and click "Request" button.


## How to use

* MQTT on Docker

```zsh
% docker run -d -p 1883:1883 -p 9001:9001 --name=mosquitto sourceperl/mosquitto
```

* Server Side

```js
const mqttpress = require("mqttpress");
const config = require("./config");
const debug = require("debug")("server");

const app = mqttpress();

app.hear("news/#", (res)=>{
  debug(`hear: ${res.topic}, from: ${JSON.stringify(res.from)}, data: ${JSON.stringify(res.data)}`);
  res.send({msg: `congrat ${res.data.winner} win!`});
});

app.hear("project/+/news", (res)=>{
  debug(`hear: ${res.topic}, from: ${JSON.stringify(res.from)}, data: ${JSON.stringify(res.data)}`);
  res.send({msg: `congrat ${res.data.loser} lose!`});
});

app.on("listening", ()=>{
  debug(`listen ${app.id}`);
});

app.on("error", (err)=>{
  console.error(err.stack);
});

app.listen(`ws://${config.mqtt.host}:${config.mqtt.ports.ws}`);
```

* Client Side

```js
const mqttpress = require("mqttpress");
const config = require("./config");
const debug = require("debug")("client");

const app = mqttpress();
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

app.connect(`ws://${config.mqtt.host}:${config.mqtt.ports.ws}`);
```

## TODO
* supporting multiple server response

## License
Apache License Version 2
