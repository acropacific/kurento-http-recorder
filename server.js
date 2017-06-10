var http = require('http'),
    fs = require('fs'),
    path = require('path'),
    static = require('node-static'),
    sox = require('sox-stream');

var PORT = 8897,
    RECORDINGS_DIR = '/tmp/recordings'; // CHANGE THIS

var fileServer = new static.Server(RECORDINGS_DIR);

http.createServer(function(req, res) {
  switch (req.method) {
    case 'POST':
      doPut(req, res);
      break;
    case 'GET':
      doGet(req, res);
      break;
    default:
      error_404(res);
  }
}).listen(PORT, function() {
  console.log('Listening for requests on port ' + PORT);
});

function getFilename(req) {
  return "filename.webm"; // CHANGE THIS: convert request params to filename
}

function doPut(req, res) {
  var fname = getFilename(req);
  if (fname) {
    // assuming all chunks are received in order we can just append them
    var writeStream = fs.createWriteStream(path.join(RECORDINGS_DIR, fname), { flags: 'a+' });

    req.on('data', function(data) {
      console.log('Writing data to file: ' + data.length + ' bytes');
      writeStream.write(data);
    });

    req.on('end', function() {
      console.log('End of file\n');
      writeStream.end();
      res.writeHead(200);
      res.end();
    });
  } else {
    console.log("Bad PUT request");
    error404(res);
  }
}

function doGet(req, res) {
  var fname = getFilename(req);
  if (fname) {
    req.addListener('end', function () {
      fileServer.serveFile(fname, 200, {}, req, res).on('error', function(err) {
        console.log("Error serving file: " + err);
      });
    }).resume();
  } else {
    console.log("Bad GET request");
    error404(res);
  }
}

function error404(res) {
  res.writeHead(404);
  res.end();
}
