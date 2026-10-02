'use strict';
// Local demo server. No legacy Express installation is needed.
var fs = require('fs');
var http = require('http');
var path = require('path');
var root = __dirname;
var contentTypes = {'.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
  '.png': 'image/png', '.gif': 'image/gif', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'};

var server = module.exports = http.createServer(function(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {'Allow': 'GET, HEAD'});
    return res.end();
  }
  var requested;
  try { requested = decodeURIComponent(req.url.split('?')[0]); }
  catch (error) { res.writeHead(400); return res.end(); }
  if (requested === '/') requested = '/index.html';
  if (!/^\/(?:index\.html$|(?:demos|libs|src|test)\/)/.test(requested) || requested.indexOf('\0') !== -1) {
    res.writeHead(403); return res.end();
  }
  var file = path.resolve(root, '.' + requested);
  var relative = path.relative(root, file);
  if (relative.indexOf('..') === 0 || path.isAbsolute(relative)
      || !/^(?:index\.html$|(?:demos|libs|src|test)[\\/])/.test(relative)
      || relative.split(/[\\/]/).some(function(part) { return part.charAt(0) === '.'; })) {
    res.writeHead(403); return res.end();
  }
  fs.realpath(file, function(error, realFile) {
    if (error) { res.writeHead(404); return res.end(); }
    var realRelative = path.relative(root, realFile);
    if (realRelative.indexOf('..') === 0 || path.isAbsolute(realRelative)) {
      res.writeHead(403); return res.end();
    }
    fs.stat(realFile, function(error, stat) {
    if (error || !stat.isFile()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, {'Content-Type': contentTypes[path.extname(file)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff'});
    if (req.method === 'HEAD') return res.end();
    var stream = fs.createReadStream(realFile);
    stream.on('error', function() { res.destroy(); });
    stream.pipe(res);
    });
  });
});

if (require.main === module) {
  var port = Number(process.env.PORT || 8081);
  server.listen(port, '127.0.0.1', function() {
    console.log('SelectBoxIt demos: http://127.0.0.1:' + server.address().port);
  });
}
