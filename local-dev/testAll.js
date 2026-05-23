const { invoke } = require('./run');

async function print(title, value) {
  console.log(`\n===== ${title} =====`);
  console.log(JSON.stringify(value, null, 2));
}

async function main() {
  const init = await invoke('initData', {});
  await print('initData', init);

  const routes = await invoke('getRoutes', {});
  await print('getRoutes', routes);

  const session = await invoke('createSession', {
    routeType: 'digital_nomad',
    userType: '数字游民',
    interest: '乡建观察',
    duration: '45分钟'
  });
  await print('createSession', session);

  const sessionId = session.data.sessionId;
  const spot = await invoke('getSpotContent', { sessionId, spotId: 'old_house' });
  await print('getSpotContent', spot);

  const note = await invoke('submitNote', {
    sessionId,
    spotId: 'old_house',
    note: '这栋老屋让我感觉村庄的过去和未来正在交接。',
    images: ['cloud://local-dev/photo1.jpg']
  });
  await print('submitNote', note);

  const report = await invoke('generateReport', { sessionId });
  await print('generateReport', report);

  const semiLogin = await invoke('semiAuthLogin', { redirectAfter: '/login/success' });
  await print('semiAuthLogin', semiLogin);

  const semiCallback = await invoke('semiAuthCallback', {
    code: 'mock_code_001',
    state: semiLogin.data.state,
    mockUserinfo: {
      sub: 'semi_mock_subject_001',
      handle: 'semi_mock_user',
      wallet_address: '0x0000000000000000000000000000000000000000',
      phone_verified: false,
      email_verified: false
    }
  });
  await print('semiAuthCallback', semiCallback);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
