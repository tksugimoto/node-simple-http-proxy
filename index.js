const http = require('http');
const net = require('net');
const parseUrl = require('url').parse;

const HTTP_PROXY_PORT = Number(process.argv[2]) || 8080;

const WarnLog = (clientReq) => (type, err) => {
    console.warn({
        type,
        time: new Date(),
        url: clientReq.url,
        err,
    });
};

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
    const warnLog = WarnLog(clientReq);
    serverReq.on('error', err => {
        clientRes.writeHead(400, 'Bad Request');
        clientRes.end(err.message);
        warnLog('serverReq.error', err);
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
    const warnLog = WarnLog(clientReq);
    serverSocket.on('error', err => {
        clientSocket.end(err.message);
        warnLog('serverSocket.error', err);
    });
    clientSocket.on('error', err => {
        serverSocket.destroy();
        warnLog('clientSocket.error', err);
    });
});

proxyServer.listen(HTTP_PROXY_PORT, () => {
    console.info(`Proxy server started. (IP:port = 0.0.0.0:${HTTP_PROXY_PORT})`);
});
