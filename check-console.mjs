// 브라우저 콘솔 경고 확인 스크립트
// Puppeteer를 사용하여 브라우저를 열고 콘솔 로그를 확인합니다

import puppeteer from 'puppeteer';

const url = 'http://localhost:3000/home';

async function checkConsoleWarnings() {
  console.log('브라우저를 시작합니다...');
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  
  const errors = [];
  const warnings = [];
  
  // 콘솔 메시지 수집
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    if (type === 'error') {
      errors.push(text);
      console.log(`[ERROR] ${text}`);
    } else if (type === 'warning') {
      warnings.push(text);
      console.log(`[WARNING] ${text}`);
    }
  });
  
  // 페이지 에러 수집
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`[PAGE ERROR] ${error.message}`);
  });
  
  console.log(`\n${url}로 이동합니다...`);
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
  
  console.log('\n페이지 로드 완료. 3초 대기...');
  await page.waitForTimeout(3000);
  
  // NaN 확인
  const bodyText = await page.evaluate(() => document.body.innerText);
  const hasNaN = bodyText.includes('NaN');
  
  console.log('\n=== 테스트 결과 ===');
  console.log(`에러 개수: ${errors.length}`);
  console.log(`경고 개수: ${warnings.length}`);
  console.log(`NaN 표시 여부: ${hasNaN ? 'YES ❌' : 'NO ✅'}`);
  
  if (errors.length > 0) {
    console.log('\n=== 에러 목록 ===');
    errors.forEach((err, i) => console.log(`${i + 1}. ${err}`));
  }
  
  if (warnings.length > 0) {
    console.log('\n=== 경고 목록 ===');
    warnings.forEach((warn, i) => console.log(`${i + 1}. ${warn}`));
  }
  
  // NaN 관련 경고 확인
  const nanWarnings = [...errors, ...warnings].filter(msg => 
    msg.includes('NaN') || msg.includes('Received NaN')
  );
  
  if (nanWarnings.length > 0) {
    console.log('\n❌ NaN 관련 경고가 발견되었습니다:');
    nanWarnings.forEach((warn, i) => console.log(`${i + 1}. ${warn}`));
  } else {
    console.log('\n✅ NaN 관련 경고가 없습니다!');
  }
  
  // HistoryPage 경고 확인
  const historyWarnings = [...errors, ...warnings].filter(msg => 
    msg.includes('HistoryPage') || msg.includes('LinkComponent')
  );
  
  if (historyWarnings.length > 0) {
    console.log('\n❌ HistoryPage 관련 경고가 발견되었습니다:');
    historyWarnings.forEach((warn, i) => console.log(`${i + 1}. ${warn}`));
  } else {
    console.log('\n✅ HistoryPage 관련 경고가 없습니다!');
  }
  
  console.log('\n브라우저를 5초간 열어둡니다...');
  await page.waitForTimeout(5000);
  
  await browser.close();
  console.log('\n완료!');
}

checkConsoleWarnings().catch(console.error);

