const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function checkModels() {
  try {
    // Google AI Studio와 API 문서에서 확인된 실제 지원 모델들
    const commonModels = [
      // 기존 안정 버전
      'gemini-pro',
      'gemini-pro-vision',
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      // 자동 최신 버전 선택
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
      // 최근 출시된 실험/프리뷰 버전
      'gemini-2.0-flash-exp',
      // 2.5 시리즈 (실제 존재 여부 확인 필요)
      'gemini-2.5-pro-exp-03-25',
      'gemini-2.5-flash-preview-08-20',
      'gemini-2.5-pro-preview-05-06',
      'gemini-2.5-flash-8b-preview-10-09',
      'gemini-2.5-pro-exp-11-20'
    ];

    console.log('🔍 Testing available Gemini models with actual API calls...');
    console.log('API Key present:', !!process.env.GEMINI_API_KEY);
    console.log('');

    for (const modelName of commonModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        // 실제 API 요청으로 테스트 (간단한 텍스트 생성)
        const result = await model.generateContent('Hello');
        console.log('✅ ' + modelName + ' - Working');
      } catch (error) {
        console.log('❌ ' + modelName + ' - Not working (' + error.message.substring(0, 50) + '...)');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkModels();
