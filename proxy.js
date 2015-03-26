var redis = require('redis')
var http = require('http')
var httpProxy = require('http-proxy')
var client = redis.createClient(6379, '127.0.0.1', {});
var servers = "servers";
// check if redis not working
client.on('error',function(err){ console.error(err)})
var server1 = { host: "localhost",
    port: 3001
};
var server2 = { host: "localhost",
    port: 3002
};
server1 = JSON.stringify(server1);
server2 = JSON.stringify(server2);
// console.log(server1);
// console.log(server2);
client.lpush("servers",server1);
client.lpush("servers",server2)

var proxy = httpProxy.createServer();

http.createServer(function (req, res) {
var server='';
  client.rpoplpush("servers","servers", function(err,data)
        {
            console.log(data);
            server = JSON.parse(data);

            //   console.log("server == " + server);
              var target = { target:  server};
              console.log('Call to server: ', target);
              proxy.web(req, res, target);

              server = JSON.stringify(server);
              //client.lpush(servers,server);
  

        });

}).listen(3000);
