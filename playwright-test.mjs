// MCP Playwright 테스트 시나리오
// 이 파일은 MCP Playwright 서버를 통해 실행됩니다

const testScenarios = [
  {
    name: '홈 페이지 로드 및 NaN 확인',
    steps: [
      { action: 'navigate', url: 'http://localhost:3000/home' },
      { action: 'wait', selector: 'text=Overall Skin Score' },
      { action: 'check', text: 'NaN', shouldNotExist: true },
      { action: 'screenshot', name: 'home-page' },
    ],
  },
  {
    name: '히스토리 페이지 접근',
    steps: [
      { action: 'navigate', url: 'http://localhost:3000/history' },
      { action: 'wait', selector: 'text=분석 히스토리' },
      { action: 'check', text: 'NaN', shouldNotExist: true },
      { action: 'screenshot', name: 'history-page' },
    ],
  },
  {
    name: '콘솔 에러 확인',
    steps: [
      { action: 'navigate', url: 'http://localhost:3000/home' },
      { action: 'wait', timeout: 3000 },
      { action: 'getConsoleLogs', type: 'error' },
    ],
  },
];

export default testScenarios;

