const assert = require("power-assert");
const mqttpress = require("../");

describe("mqttpress", ()=>{
  describe("create instance", ()=>{
    it("mqttpress() should return MQTTPress instance", ()=>{
      const app = mqttpress();
      assert(typeof app.id === "string");
      assert(app._allPrefix === "$ALL");
    });
    it("MQTTPress instance by new mqttpress.MQTTPress", ()=>{
      const app = new mqttpress.MQTTPress();
      assert(typeof app.id === "string");
      assert(app._allPrefix === "$ALL");
    });
  });

  describe("server", ()=>{
    const endpoint = `mqtt:${process.env.MQTT_HOST || "mqtt"}:1883`;
    let app;
    beforeEach(()=>{
      app = mqttpress();
    });

    it("can add a handler for a topic", ()=>{
      app.hear("topic", (ctx)=>{});
      assert(Array.isArray(app.isHear("topic")));
      assert(typeof app.isHear("topic")[0] === "function");
    });
    it("should return false unhear topics", ()=>{
      assert(app.isHear("topic") === false);
    });

    it("listen should throw Error for empty endpoint", ()=>{
      try{
        app.listen();
        throw new Error("should throw error");
      }catch(err){
        assert(err instanceof Error);
      }
    });
    it("listen should throw Error for invalid protocol endpoint", ()=>{
      const endpoint = "badprotocol:somedomain";
      try{
        app.listen(endpoint);
        throw new Error("should throw error");
      }catch(err){
        assert(err instanceof Error);
      }
    });

    it("connect should throw Error for empty endpoint", ()=>{
      try{
        app.connect();
        throw new Error("should throw error");
      }catch(err){
        assert(err instanceof Error);
      }
    });
    it("connect should throw Error for invalid protocol endpoint", ()=>{
      const endpoint = "badprotocol:somedomain";
      try{
        app.connect(endpoint);
        throw new Error("should throw error");
      }catch(err){
        assert(err instanceof Error);
      }
    });

    it(`can listen to proper endpoint (${endpoint})`, (done)=>{
      app.listen(endpoint);
      app.on("listening", ()=>{
        assert(true);
        done();
      });
      app.on("error", (err)=>{
        done(new Error("cannot connect endpoint"));
      });
    });

    it(`can connect to proper endpoint (${endpoint})`, (done)=>{
      app.connect(endpoint);
      app.on("connect", ()=>{
        assert(true);
        done();
      });
      app.on("error", (err)=>{
        done(new Error("cannot connect endpoint"));
      });
    });

    it("server can receive request", (done)=>{
      const prefix = `${Date.now()}`;
      const server = mqttpress({prefix});
      const client = mqttpress({prefix});
      server.hear("topic", (ctx)=>{
        assert(ctx.id !== null);
        assert(ctx.from !== null);
        assert(ctx.topic === "topic");
        assert(ctx.data === "");
        done();
      });
      server.on("connect", ()=>{
        assert(true);
      });
      server.on("error", (err)=>{
        assert(err);
        done(new Error("cannot connect endpoint"));
      });

      server.listen(endpoint);
      server.on("listening", ()=>{
        client.connect(endpoint);
        client.on("connect", ()=>{
          client.send("topic");
        });
      });
    });

    it("client can receive response", (done)=>{
      const prefix = `${Date.now()}`;
      const server = mqttpress({prefix});
      const client = mqttpress({prefix});
      server.hear("topic", (ctx)=>{
        ctx.send("hello");
      });
      server.on("connect", ()=>{
        assert(true);
      });
      server.on("error", (err)=>{
        done(new Error("cannot connect endpoint"));
      });

      server.listen(endpoint);
      server.on("listening", ()=>{
        client.connect(endpoint);
        client.on("connect", ()=>{
          client.send("topic").then((res)=>{
            done();
          });
        });
      });
    });
  });
});
