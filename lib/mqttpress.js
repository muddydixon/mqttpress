"use strict";

const mqtt = require("mqtt");
const EventEmitter = require("events");
const uuid = require("uuid");
const debug = require("debug")("mqttpress");

const ALL_PREFIX = "$ALL";

const Response = function(mp, topic, data){
  this._mqttpress = mp;
  this.id   = data.id;
  this.from = data.from;
  this.topic = topic;
  this.data = data.data;
};

Response.prototype.send = function(data){
  const publishTopic = `${this.from}/id/${this.id}/${Date.now()}`;
  const publishData = {
    from: this._mqttpress.id,
    id: this.id,
    data: data
  };
  debug(`resp.send ${publishTopic} ${JSON.stringify(publishData)}`);
  this._mqttpress._mqtt.publish(publishTopic, JSON.stringify(publishData));
};

const MQTTPress = function(endpoint, opts){
  this.id = uuid().substr(0, 8);
  this._endpoint = endpoint;
  this._mqtt = null;
  this._handlers = {};
};

MQTTPress.topicMatch = (re, topic)=>{
  const rgx = new RegExp(re.replace(/#/g, ".+").replace(/\+/g, "[^\/]+"));
  return rgx.test(topic);
};

MQTTPress.prototype._startListen = function(){
  this._mqtt.on("message", (topic, message)=>{
    debug(`recv: ${topic}, ${message}`);
    const topicArr = topic.split("/");
    const topicPrefix = topicArr[0];
    const targetTopic = topicArr.slice(1).join("/");
    const msg = JSON.parse(message);

    if(topicPrefix === ALL_PREFIX){
      const topics = Object.keys(this._handlers).filter((tpc)=> MQTTPress.topicMatch(tpc, targetTopic));
      topics.map((tpc)=>{
        this._handlers[tpc].map((handler)=> handler(new Response(this, targetTopic, msg)));
      });
    }else if(topicArr[1] === "id"){
      this.emit(topicArr[2], null, JSON.parse(message));
    }
    this.emit();
  });
};

// for server
MQTTPress.prototype.listen = function(){
  this._mqtt = mqtt.connect(this._endpoint);
  this._mqtt.on("error", (err)=>{
    this.emit("error", err);
  });
  this._mqtt.on("connect", ()=>{
    this._mqtt.subscribe([`${ALL_PREFIX}/#`]);
    debug(`server subscribe ${ALL_PREFIX}/#`);

    this._startListen();
    this.emit("connect");
  });

};

// server api
MQTTPress.prototype.hear = function(topic, handler){
  if(!(topic in this._handlers)) this._handlers[topic] = [];
  debug(`hear ${topic}`);
  this._handlers[`${topic}`].push(handler);
};

// for client
MQTTPress.prototype.connect = function(){
  this._mqtt = mqtt.connect(this._endpoint);
  this._mqtt.on("error", (err)=>{
    this.emit("error", err);
  });
  this._mqtt.on("connect", ()=>{
    this._mqtt.subscribe([`${this.id}/#`]);
    debug(`client subscribe ${this.id}/#`);

    this._startListen();
    this.emit("connect");
  });

};

// client api
MQTTPress.prototype.send = function(topic, data, handler){
  const id  = uuid().replace(/-/g, "");
  const publishTopic = `${ALL_PREFIX}/${topic}`;
  const publishData = {
    id:   id,
    from: this.id,
    data: data
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

MQTTPress.prototype.__proto__ = new EventEmitter();

const mqttpress = function(endpoint, opts){
  return new MQTTPress(endpoint, opts);
};

module.exports = mqttpress;
