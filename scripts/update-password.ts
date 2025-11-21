/**
 * 비밀번호 업데이트 스크립트
 * 사용법: npx tsx scripts/update-password.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('환경 변수가 설정되지 않았습니다.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function updatePassword() {
  const email = '7994014@gmail.com'
  const newPassword = '123456'

  try {
    // Admin API를 사용하여 비밀번호 업데이트
    const { data, error } = await supabase.auth.admin.updateUserById(
      '06f484ba-6ab1-4e31-b480-d34f185913cf',
      { password: newPassword }
    )

    if (error) {
      console.error('비밀번호 업데이트 실패:', error)
      return
    }

    console.log('✅ 비밀번호가 성공적으로 업데이트되었습니다!')
    console.log('이메일:', email)
    console.log('새 비밀번호:', newPassword)
  } catch (err) {
    console.error('오류 발생:', err)
  }
}

updatePassword()

