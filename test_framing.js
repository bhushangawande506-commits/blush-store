const { spawn } = require('child_process');
const fs = require('fs');

const viewports = [
  { name: 'desktop_1920x1080', w: 1920, h: 1080, mobile: false },
  { name: 'desktop_1366x768',  w: 1366, h: 768,  mobile: false },
  { name: 'tablet_768x1024',   w: 768,  h: 1024, mobile: true  },
  { name: 'mobile_390x844',    w: 390,  h: 844,  mobile: true  },
  { name: 'mobile_360x800',    w: 360,  h: 800,  mobile: true  }
];

async function captureOne(vp) {
  return new Promise((resolve, reject) => {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    const edge = spawn(edgePath, [
      '--remote-debugging-port=9232',
      '--headless=new',
      '--disable-gpu',
      `--window-size=${vp.w},${vp.h}`,
      'about:blank'
    ]);

    setTimeout(async () => {
      try {
        const tabs = await (await fetch('http://127.0.0.1:9232/json')).json();
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
          width: vp.w,
          height: vp.h,
          deviceScaleFactor: 1,
          mobile: vp.mobile
        });

        await send('Page.navigate', { url: 'http://localhost:3000/' });
        // wait 2.5s for video playback to start
        await new Promise(r => setTimeout(r, 2500));

        // Evaluate computed object-position and check visibility
        const evalRes = await send('Runtime.evaluate', {
          expression: `(() => {
            const v = document.querySelector('.hero-video-element');
            const h = document.querySelector('.hero-section');
            const c = document.querySelector('.hero-content');
            return {
              viewport: { w: window.innerWidth, h: window.innerHeight },
              videoComputedObjPos: v ? window.getComputedStyle(v).objectPosition : null,
              videoComputedObjFit: v ? window.getComputedStyle(v).objectFit : null,
              videoComputedTransform: v ? window.getComputedStyle(v).transform : null,
              heroHeight: h ? h.getBoundingClientRect().height : null,
              contentHeight: c ? c.getBoundingClientRect().height : null
            };
          })()`,
          returnByValue: true
        });

        console.log(`[${vp.name}] Computed:`, JSON.stringify(evalRes.result.value));

        const ss = await send('Page.captureScreenshot', { format: 'png' });
        fs.writeFileSync(`framing_${vp.name}.png`, Buffer.from(ss.data, 'base64'));
        console.log(`[${vp.name}] Saved framing_${vp.name}.png`);

        ws.close();
        edge.kill();
        resolve();
      } catch (e) {
        edge.kill();
        reject(e);
      }
    }, 1500);
  });
}

async function run() {
  for (const vp of viewports) {
    console.log(`Capturing ${vp.name}...`);
    await captureOne(vp);
    // short delay between instances
    await new Promise(r => setTimeout(r, 800));
  }
  console.log('All 5 viewports captured successfully!');
}

run().catch(console.error);

