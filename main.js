var redis = require('redis')
var multer  = require('multer')
var express = require('express')
var fs      = require('fs')
var app = express()
// REDIS
var client = redis.createClient(6379, '127.0.0.1', {});
var recentKeys = "recentKeys";
var images = "imagelist";

// check if redis not working
client.on('error',function(err){ console.error(err)})

///////////// WEB ROUTES

// Add hook to make it easier to get all visited URLS.
//HTTP SERVER
 var server = app.listen(3002, function () {

  var host = server.address().address
  var port = server.address().port

  console.log('Example app listening at http://%s:%s', host, port)
})

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

app.use('/uploads', express.static(__dirname+'/uploads') )

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

app.post('/upload',[ multer({ dest: './uploads/'}), function(req, res){
   //console.log(req.body) // form fields
   //console.log(req.files) // form files

   if( req.files.image )
   {
	   fs.readFile( req.files.image.path, function (err, data) {
	  		if (err) throw err;
	  		var img = new Buffer(data).toString('base64');
	  		//console.log(img);
	  		console.log(req.files.image.path);
	  		client.rpush("images",req.files.image.path);
 		});
	}

   res.status(204).end()
}]);

app.get('/meow', function(req, res) {
	
		//if (err) throw err
		client.lpop("images", function(err,data)
		{
			console.log(data);
			res.writeHead(200, {'content-type':'text/html'});
			res.write("<h1>\n<img src='"+data+"'/>");
			res.end();
		});
		
	
})



app.get('/', function(req, res) {
  res.send('hello world')
})

app.get('/get', function(req, res) {
  client.get("key", function(err,value){
  	if(value === undefined || value === null)
  		res.send("No key found");
  	else
  		res.send(value);
	});
})

app.get('/set', function(req, res) {
  client.set("key", "this message will self-destruct in 10 seconds");
  	client.expire("key",10);
  	res.send('Key set. Will expire in 10 seconds');
})


