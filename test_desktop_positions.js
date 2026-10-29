const { spawn } = require('child_process');
const fs = require('fs');

async function testPosition(pos, w, h, name) {
  return new Promise((resolve) => {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const edge = spawn(edgePath, [
      '--remote-debugging-port=9233',
      '--headless=new',
      '--disable-gpu',
      `--window-size=${w},${h}`,
      'about:blank'
    ]);

    setTimeout(async () => {
      try {
        const tabs = await (await fetch('http://127.0.0.1:9233/json')).json();
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
          width: w,
          height: h,
          deviceScaleFactor: 1,
          mobile: false
        });

        await send('Page.navigate', { url: 'http://localhost:3000/' });
        await new Promise(r => setTimeout(r, 2200));

        // Inject the test object-position dynamically
        await send('Runtime.evaluate', {
          expression: `(() => {
            const v = document.querySelector('.hero-video-element');
            if (v) v.style.objectPosition = '${pos}';
          })()`
        });

        await new Promise(r => setTimeout(r, 400));
        const ss = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(`${name}.png`, Buffer.from(ss.data, 'base64'));
        console.log(`Saved ${name}.png for ${pos} at ${w}x${h}`);

        ws.close();
        edge.kill();
        resolve();
      } catch (e) {
        edge.kill();
        resolve();
      }
    }, 1200);
  });
}

async function run() {
  await testPosition('center 5%', 1920, 1080, 'test_1920_pos_5pct');
  await testPosition('center 10%', 1920, 1080, 'test_1920_pos_10pct');
  await testPosition('center top', 1920, 1080, 'test_1920_pos_top');
  await testPosition('center 10%', 1366, 768, 'test_1366_pos_10pct');
  console.log('Done tests!');
}

run();

