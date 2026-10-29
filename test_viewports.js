const { spawn } = require('child_process');
const fs = require('fs');

const viewports = [
  { name: '1920x1080', w: 1920, h: 1080 },
  { name: '1366x768',  w: 1366, h: 768 },
  { name: '768x1024',  w: 768,  h: 1024 },
  { name: '390x844',   w: 390,  h: 844 },
  { name: '360x800',   w: 360,  h: 800 }
];

async function captureViewport(vp) {
  return new Promise((resolve, reject) => {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const edge = spawn(edgePath, [
      '--remote-debugging-port=9229',
      '--headless=new',
      '--disable-gpu',
      `--window-size=${vp.w},${vp.h}`,
      'about:blank'
    ]);

    setTimeout(async () => {
      try {
        const tabs = await (await fetch('http://127.0.0.1:9229/json')).json();
        const tab = tabs.find(t => t.type === 'page');
        const ws = new WebSocket(tab.webSocketDebuggerUrl);
        await new Promise(r => ws.onopen = r);

        let id = 1;
        const send = (method, params = {}) => new Promise(res => {
          const i = id++;
          const h = (e) => {
            const m = JSON.parse(e.data);
            if (m.id === i) {
              ws.removeEventListener('message', h);
              res(m.result);
            }
          };
          ws.addEventListener('message', h);
          ws.send(JSON.stringify({ id: i, method, params }));
        });

        await send('Page.navigate', { url: 'http://localhost:3000/' });
        await new Promise(r => setTimeout(r, 3000));

        const ss = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(`vp_${vp.name}.png`, Buffer.from(ss.data, 'base64'));
        console.log(`Captured vp_${vp.name}.png`);

        ws.close();
        edge.kill();
        resolve();
      } catch (err) {
        edge.kill();
        reject(err);
      }
    }, 1200);
  });
}

async function run() {
  for (const vp of viewports) {
    console.log(`Testing ${vp.name}...`);
    await captureViewport(vp);
  }
  console.log('All viewports captured!');
}

run().catch(console.error);

