const { spawn } = require('child_process');
const http = require('http');
const WebSocket = require('ws');

const edge = spawn('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--user-data-dir=C:\\Projects\\STAPLE\\.edge-debug',
  'http://localhost:8081'
]);

function tryConnect(retries = 10) {
  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      const targets = JSON.parse(data);
      const target = targets.find(t => t.url.includes('8081') || t.title === 'staple');
      if (!target) {
        console.log('Targets:', targets.map(t => t.url));
        if (retries > 0) setTimeout(() => tryConnect(retries - 1), 1000);
        return;
      }
      console.log('Connecting to target:', target.url);
      const ws = new WebSocket(target.webSocketDebuggerUrl);

      ws.on('open', () => {
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Log.enable' }));
        ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
      });

      ws.on('message', (msg) => {
        const event = JSON.parse(msg);
        if (event.method === 'Runtime.consoleAPICalled') {
          console.log(`[BROWSER CONSOLE ${event.params.type}]:`, event.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' '));
        } else if (event.method === 'Runtime.exceptionThrown') {
          console.error('[BROWSER EXCEPTION]:', event.params.exceptionDetails.text, event.params.exceptionDetails.exception ? event.params.exceptionDetails.exception.description : '');
        } else if (event.method === 'Log.entryAdded') {
          console.log('[BROWSER LOG]:', event.params.entry.level, event.params.entry.text);
        }
      });

      setTimeout(() => {
        console.log('Finished capturing.');
        ws.close();
        edge.kill();
        process.exit(0);
      }, 7000);
    });
  }).on('error', () => {
    if (retries > 0) {
      setTimeout(() => tryConnect(retries - 1), 500);
    } else {
      edge.kill();
      process.exit(1);
    }
  });
}

setTimeout(tryConnect, 1500);
