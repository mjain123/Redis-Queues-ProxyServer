# Redis-Queues-ProxyServer

### Setup

Clone this repo, run npm install.
Install redis and run on localhost:6379
A simple web server

Use express to install a simple web server.

var server = app.listen(3000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})
Express uses the concept of routes to use pattern matching against requests and sending them to specific functions. You can simply write back a response body.

app.get('/', function(req, res) {
  res.send('hello world')
})
Redis

You will be using redis to build some simple infrastructure components, using the node-redis client.

var redis = require('redis')
var client = redis.createClient(6379, '127.0.0.1', {})

#### Set Get commands

Get command 
```sh
app.get('/get', function(req, res) {
  client.get("key", function(err,value){
  	if(value === undefined || value === null)
  		res.send("No key found");
  	else
  		res.send(value);
	});
})
```
The get command of redis returns empty string when the key does not exists.

Set command
```sh
app.get('/set', function(req, res) {
  client.set("key", "this message will self-destruct in 10 seconds");
  	client.expire("key",10);
  	res.send('Key set. Will expire in 10 seconds');
})
```
client.set sets the key and client.expire makes the key expire in given time.

#### Recent urls

To get the recent urls, first we push each accessed url on the redis keylist. And then when the command is executed, we return the urls by popping it from the redis keylist.

```sh
app.use(function(req, res, next) 
{
	console.log(req.method, req.url);
  //console.log( server.address().port);
		// ... INSERT HERE.
  var host = server.address().address;
  var port = server.address().port;
  var url = 'http://'+host+':'+port+req.url;
  //console.log(url);
  client.lpush(recentKeys, url);
  client.ltrim(recentKeys, 0 , 4);
	next(); // Passing the request to the next handler in the stack.
});

app.get('/recent', function(req, res){
      client.lrange(recentKeys, 0, 4, function(err, value){
      console.log("Last five requests: \n");
      var result='';
      for (var i = 0; i < value.length; i++) {
        result = result + (i+1) +'.'+ value[i] +" <br>";
        result = result +"\n";
      }
      console.log(result);
      res.send(result);
  })
});
```

#### Upload/ Meow
Upload command can be used to upload an image using redis by making a post request. Image is pushed using the lpush command putting it in the left end of the queue. In the meow command, we pop using rpop command the display the picture on top of the queue.
```sh

app.use('/uploads', express.static(__dirname+'/uploads') )

app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   if( req.files.image )
   {
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
	  		var img = new Buffer(data).toString('base64');
	  		client.rpush("images",req.files.image.path);
 		});
	}
 res.status(204).end()
}]);


app.get('/meow', function(req, res) {
		client.lpop("images", function(err,data)
		{
			res.writeHead(200, {'content-type':'text/html'});
			res.write("<h1>\n<img src='"+data+"'/>");
			res.end();
		});
})
```

#### Additional service running

To run additional service, we execute the service on port 3000 and port 3001 as shown in image below.

#### Demonstrate proxy

The proxy server is run on localhost:8000. The code is present in proxy.js. We push all the servers on redis keylist. For each request, we pop one server from the keylist and pass on the request to that server. After this we push the server back to the end of the list.
