const path = require('path');
const Module = require('module');
const mockCloud = require('./mockCloud');

const root = path.join(__dirname, '..');
const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'wx-server-sdk') return mockCloud;
  return originalLoad.apply(this, arguments);
};

async function invoke(name, event = {}) {
  const fnPath = path.join(root, 'cloudfunctions', name, 'index.js');
  delete require.cache[require.resolve(fnPath)];
  const fn = require(fnPath);
  return fn.main(event, {});
}

async function presetEvent(name) {
  if (name === 'initData' || name === 'getRoutes') return {};

  if (name === 'createSession') {
    return {
      routeType: 'digital_nomad',
      userType: '数字游民',
      interest: '乡建观察',
      duration: '45分钟'
    };
  }

  if (['getSpotContent', 'submitNote', 'generateReport'].includes(name)) {
    await invoke('initData', {});
    const sessionRes = await invoke('createSession', {
      routeType: 'digital_nomad',
      userType: '数字游民',
      interest: '乡建观察',
      duration: '45分钟'
    });
    const sessionId = sessionRes.data.sessionId;
    if (name === 'getSpotContent') {
      return { sessionId, spotId: 'old_house' };
    }
    if (name === 'submitNote') {
      return {
        sessionId,
        spotId: 'old_house',
        note: '这栋老屋让我感觉村庄的过去和未来正在交接。',
        images: ['cloud://local-dev/photo1.jpg']
      };
    }
    if (name === 'generateReport') {
      await invoke('submitNote', {
        sessionId,
        spotId: 'old_house',
        note: '这栋老屋让我感觉村庄的过去和未来正在交接。',
        images: []
      });
      return { sessionId };
    }
  }

  if (name === 'semiAuthLogin') {
    return { redirectAfter: '/login/success' };
  }

  return {};
}

async function main() {
  const name = process.argv[2];
  if (!name) {
    console.error('Usage: node local-dev/run.js <functionName> [jsonEvent|--preset]');
    process.exit(1);
  }

  mockCloud.__setOpenId(process.env.MOCK_OPENID || 'mock_openid_001');
  const arg = process.argv[3];
  let event = {};
  if (arg === '--preset' || !arg) {
    event = await presetEvent(name);
  } else {
    event = JSON.parse(arg);
  }

  const res = await invoke(name, event);
  console.log(JSON.stringify(res, null, 2));
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { invoke };
