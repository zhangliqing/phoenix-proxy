const WebSocket = require('ws');
var url = require('url');
var request = require('request')
var service = require('./service.local')

const wss = new WebSocket.Server({port: 8080});

function Pair(frontWs) {
  this.frontWs = frontWs
  this.backWs = null
}

Pair.prototype = {
  connect: function(addr) {
    this.backWs = new WebSocket(addr)

    this.backWs.on('message', this.frontWs.send)
    this.frontWs.on('message', this.backWs.send)

    this.backWs.on('close', function() {
      if (this.frontWs.readyState == WebSocket.OPEN) {
        this.backWs = new WebSocket(addr)
        return
      }
    })


    this.backWs.on('error', function() {
      if (this.frontWs.readyState == WebSocket.OPEN) {
        this.backWs = new WebSocket(addr)
        return
      }
    })

    this.frontWs.on('close', function() {
      this.backWs.close()
    })

    this.frontWs.on('error', function() {
      this.backWs.close()
    })
  }
}

wss.on('connection', function connection(ws, req) {
  var pair = new Pair(ws);
  const location = url.parse(req.url, true);
  var pathname = location.pathname;
  var serviceName = pathname.substr(1)

  request.get({url: 'http://117.50.1.134:8080/v2-beta/projects/1a3504' + '/services'}, function(err, httpResponse, body) {
    var parsedServices = JSON.parse(body)
    for (var i = 0; i < parsedServices.data.length; i++) {
      if (parsedServices.data[i].name == serviceName) {
        var instanceId = parsedServices.data[i].instanceIds[0]
        console.log('instanceId: ' + instanceId)
        request.get({url: 'http://117.50.1.134:8080/v2-beta/projects/1a3504' + '/containers/' + instanceId}, function(err, httpResponse, body1) {
          var parsedContainer = JSON.parse(body1)
          console.log(parsedContainer.primaryIpAddress)
          var containerIp = parsedContainer.primaryIpAddress

          var addr = 'ws://' + containerIp + ':5678'
          pair.connect(addr)
        })
        break
      }
    }
  })
});
