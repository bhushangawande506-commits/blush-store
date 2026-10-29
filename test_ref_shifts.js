const { spawn } = require('child_process');
const fs = require('fs');

async function testShift(shift) {
  return new Promise((resolve) => {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const edge = spawn(edgePath, [
      '--remote-debugging-port=9234',
      '--headless=new',
      '--disable-gpu',
      '--window-size=1024,545',
      'about:blank'
    ]);

    setTimeout(async () => {
      try {
        const tabs = await (await fetch('http://127.0.0.1:9234/json')).json();
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

        await send('Emulation.setDeviceMetricsOverride', {
          width: 1024,
          height: 545,
          deviceScaleFactor: 1,
          mobile: false
        });

        await send('Page.navigate', { url: 'http://localhost:3000/' });
        await new Promise(r => setTimeout(r, 2000));

        await send('Runtime.evaluate', {
          expression: `(() => {
            const c = document.querySelector('.hero-content');
            if (c) c.style.transform = 'translateY(${shift}px)';
          })()`
        });

        await new Promise(r => setTimeout(r, 300));
        const ss = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(`ref_comp_shift_${shift}.png`, Buffer.from(ss.data, 'base64'));
        console.log(`Saved ref_comp_shift_${shift}.png`);

        ws.close();
        edge.kill();
        resolve();
      } catch(e) {
        edge.kill();
        resolve();
      }
    }, 1200);
  });
}

async function run() {
  await testShift(100);
  await testShift(120);
  await testShift(140);
  console.log('Done tests');
}

run();

