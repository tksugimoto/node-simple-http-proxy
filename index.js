const http = require('http');
const net = require('net');
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

proxyServer.on('connect', (clientReq, clientSocket) => {
    const serverUrl = parseUrl('https://' + clientReq.url);
    const serverSocket = net.createConnection(serverUrl.port, serverUrl.hostname);
    serverSocket.once('connect', () => {
        clientSocket.write('HTTP/1.1 200 Connection established\r\n\r\n');
        clientSocket.pipe(serverSocket);
        serverSocket.pipe(clientSocket);
    });
});

proxyServer.listen(HTTP_PROXY_PORT);
