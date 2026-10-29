const { spawn } = require('child_process');
const fs = require('fs');

const viewports = [
  { name: '1920x1080', w: 1920, h: 1080, isMobile: false },
  { name: '1366x768',  w: 1366, h: 768,  isMobile: false },
  { name: '768x1024',  w: 768,  h: 1024, isMobile: true  },
  { name: '390x844',   w: 390,  h: 844,  isMobile: true  },
  { name: '360x800',   w: 360,  h: 800,  isMobile: true  }
];

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--remote-debugging-port=9230',
    '--headless=new',
    '--disable-gpu',
    '--window-size=1920,1080',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const tabs = await (await fetch('http://127.0.0.1:9230/json')).json();
  const pageTab = tabs.find(t => t.type === 'page');
  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
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

  await send('Page.enable');
  await send('Page.navigate', { url: 'http://localhost:3000/' });
  await new Promise(r => setTimeout(r, 3000));

  for (const vp of viewports) {
    console.log(`Setting viewport: ${vp.name}`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.isMobile
    });
    await send('Emulation.setVisibleSize', { width: vp.w, height: vp.h });
    await new Promise(r => setTimeout(r, 1000));

    const ss = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`vp_curr_${vp.name}.png`, Buffer.from(ss.data, 'base64'));
    console.log(`Saved vp_curr_${vp.name}.png`);
  }

  ws.close();
  edge.kill();
  console.log('Finished capturing all viewports.');
}

run().catch(console.error);

