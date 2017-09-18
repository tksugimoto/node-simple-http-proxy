const http = require('http');
const { parse: parseUrl } = require('url');

const HTTP_PROXY_PORT = Number(process.argv[2]) || 8080;

const proxyServer = http.createServer();

proxyServer.on('request', (clientReq, clientRes) => {
    const url = parseUrl(clientReq.url);
    const serverReq = http.request({
        hostname : url.hostname,
        port : url.port,
        path : url.path,
        method : clientReq.method,
        headers : clientReq.headers,
    });
    serverReq.once('response', serverRes => {
        clientRes.writeHead(serverRes.statusCode, serverRes.headers);
        serverRes.pipe(clientRes);
    });
    clientReq.pipe(serverReq);
});

proxyServer.listen(HTTP_PROXY_PORT);
