const mqtt = require("mqtt");
const EventEmitter = require("events");
const uuid = require("uuid");
const Url = require("url");
const debug = require("debug")("mqttpress");

const ALL_PREFIX = "$ALL";

class Response{
  constructor(mp, topic, data){
    this._mqttpress = mp;
    this.id   = data.id;
    this.from = data.from;
    this.topic = topic;
    this.data = data.data;
  }
  send(data){
    const publishTopic = `${this.from}/id/${this.id}/${Date.now()}`;
    const publishData = {
      from: this._mqttpress.id,
      id: this.id,
      data: data
    };
    debug(`resp.send ${publishTopic} ${JSON.stringify(publishData)}`);
    this._mqttpress._mqtt.publish(publishTopic, JSON.stringify(publishData));
  }
};

class MQTTPress extends EventEmitter {
  constructor(opts = {}){
    super();
    this.id = uuid().substr(0, 8);
    this._allPrefix = opts.prefix || ALL_PREFIX;
    this._mqtt = null;
    this._handlers = {};
    this._mqttOpt = opts;
  }
  _startListen(){
    this._mqtt.on("message", (topic, message)=>{
      debug(`recv: ${topic}, ${message} ${JSON.stringify(this._handlers)}`);
      const topicArr = topic.split("/");
      const topicPrefix = topicArr[0];
      const targetTopic = topicArr.slice(1).join("/");
      const msg = JSON.parse(message);

      if(topicPrefix === this._allPrefix){
        const topics = Object.keys(this._handlers).filter((tpc)=> MQTTPress.topicMatch(tpc, targetTopic));
        topics.map((tpc)=>{
          this._handlers[tpc].map((handler)=> handler(new Response(this, targetTopic, msg)));
        });
      }else if(topicArr[1] === "id"){
        this.emit(topicArr[2], null, JSON.parse(message));
      }
      this.emit();
    });
  }
  listen(endpoint){
    if(!endpoint || typeof endpoint !== "string") throw new Error("endpoint require");
    const ep = Url.parse(endpoint);
    if(["mqtt:", "mqtts:", "ws:", "wss:"].indexOf(ep.protocol) === -1) throw new Error(`endpoint should have one of mqtt, mqtts, ws, wss: actual ${ep.protocol}`);
    this._mqtt = mqtt.connect(endpoint);
    this._mqtt.on("error", (err)=>{
      this.emit("error", err);
    });
    this._mqtt.on("connect", ()=>{
      this._mqtt.subscribe([`${this._allPrefix}/#`]);
      debug(`server subscribe ${this._allPrefix}/#`);

      this._startListen();
      this.emit("listening");
    });
  }

  hear(topic, handler){
    if(!(topic in this._handlers)) this._handlers[topic] = [];
    debug(`hear ${topic}`);
    this._handlers[`${topic}`].push(handler);
  }

  isHear(topic){
    if(topic in this._handlers){
      return this._handlers[topic];
    }
    return false;
  }

  connect(endpoint){
    if(!endpoint || typeof endpoint !== "string") throw new Error("endpoint require");
    const ep = Url.parse(endpoint);
    if(["mqtt:", "mqtts:", "ws:", "wss:"].indexOf(ep.protocol) === -1) throw new Error(`endpoint should have one of mqtt, mqtts, ws, wss: actual ${ep.protocol}`);
    this._mqtt = mqtt.connect(endpoint);
    this._mqtt.on("error", (err)=>{
      this.emit("error", err);
    });
    this._mqtt.on("connect", ()=>{
      this._mqtt.subscribe([`${this.id}/#`]);
      debug(`client subscribe ${this.id}/#`);

      this._startListen();
      this.emit("connect");
    });
  }
  send(topic, data, handler){
    const id  = uuid().replace(/-/g, "");
    const publishTopic = `${this._allPrefix}/${topic}`;
    const publishData = {
      id:   id,
      from: this.id,
      data: data || ""
    };
    debug(`send: ${publishTopic}, ${JSON.stringify(publishData)}`);
    return new Promise((resolve, reject)=>{
      this._mqtt.publish(publishTopic, JSON.stringify(publishData));
      // TODO: サーバの複数のトピックがマッチして返ってくる場合、最初の1つしか受け取れない(resolveされるため)
      this.once(id, handler ? handler : (err, data)=>{
        if(err) return reject(err);
        return resolve(data);
      });
    });
  };
};

MQTTPress.topicMatch = (re, topic)=>{
  const rgx = new RegExp(re.replace(/#/g, ".+").replace(/\+/g, "[^\/]+"));
  return rgx.test(topic);
};

const mqttpress = (endpoint, opts)=>{
  return new MQTTPress(endpoint, opts);
};
mqttpress.MQTTPress = MQTTPress;

module.exports = mqttpress;
