const WebSocket = require('ws');
var url = require('url');
var request = require('request')
var service = require('service.local')

const wss = new WebSocket.Server({port: 8080});

wss.on('connection', function connection(ws, req) {
  const location = url.parse(req.url, true);
  var pathname = location.pathname;
  var serviceName = pathname.substr(1)
  console.log(serviceName)
  request.get({url: service.rancher.endpoint + '/services'}, function (err, httpResponse, body) {
    var parsedServices = JSON.parse(body)
    for (var i = 0; i < parsedServices.data.length; i++) {
      if (parsedServices.data[i].name == serviceName) {
        var instanceId = parsedServices.data[i].instanceIds[0]
        console.log('instanceId: '+instanceId)
        request.get({url: service.rancher.endpoint + '/containers/' + instanceId}, function (err, httpResponse, body1) {
          var parsedContainer = JSON.parse(body1)
          var containerIp = parsedContainer.primaryIpAddress
          const wsClient = new WebSocket('ws://' + containerIp + ':5678');
          wsClient.on('open', function () {
            ws.on('message', function (message) {
              wsClient.send(message)
            });
            wsClient.on('message', function (data) {
              ws.send(data)
            })
          })
          ws.on('close',function () {
            wsClient.close()
          })
        })
        break
      }
    }
  })
});
