mqttpress
-----

Serverless API Server emulated by MQTT


```
+--------+
|  MQTT  |
+--------+
 |  |   |
 |  |   +--------------------------------------+
 |  |                                          |
 |  +------------------+                       |
 |                     |                       |
+---------------+    +-------------------+   +------------------+
|  Server Page  |	 |  Client Page (1)  |	 |  Client Page (2) |
+---------------+	 +-------------------+	 +------------------+

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

## How to use

* Docker

```zsh
% docker run -d -p 1883:1883 -p 9001:9001 --name=mosquitto sourceperl/mosquitto
```

* Server Side

```js
"use strict";

const mqttpress = require("../lib/mqttpress");
const debug = require("debug")("server");

const app = mqttpress("mqtt://192.168.99.100:1883");

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
```

* Client Side (node)

```js
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
```

* Client Side (web)

1. replace debug with console.log
1. mqtt endpoint `mqtt://192.168.99.100:1883` with `ws://192.168.99.100:9001`
1. browserify / webpack: `$(npm bin)/browserify example/client.js -o example/client-web.js`
1. open index.html below:

```html
<!doctype html>
<html>
	<head>
	</head>
	<body>
		<script src="./client-web.js"></script>
	</body>
</html>
```

## TODO
* test
* setting prefix for supporting [sango](https://sango.shiguredo.jp/)
* supporting multiple server response

## License
Apache License Version 2
