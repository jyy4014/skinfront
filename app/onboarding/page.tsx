'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Check, Loader2, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

// Zod 스키마 정의
const onboardingSchema = z.object({
  nickname: z.string().min(2, "닉네임은 2글자 이상이어야 합니다.").max(10, "10글자 이내로 입력해주세요."),
  birth_year: z.string().regex(/^(19|20)\d{2}$/, "올바른 태어난 연도 4자리를 입력해주세요. (예: 1995)"),
  gender: z.enum(['M', 'F']).refine((val) => val !== undefined, "성별을 선택해주세요."),
  skin_type: z.enum(['dry', 'oily', 'combination', 'sensitive']).refine((val) => val !== undefined, "피부 타입을 선택해주세요."),
  concerns: z.array(z.string()).min(1, "최소 1개 이상의 고민을 선택해주세요.").max(3, "고민은 최대 3개까지만 선택 가능합니다."),
});

type OnboardingForm = z.infer<typeof onboardingSchema>;

// 옵션 데이터
const genderOptions = [
  { value: 'M', label: '남성', emoji: '👨' },
  { value: 'F', label: '여성', emoji: '👩' },
];

const skinTypeOptions = [
  { value: 'dry', label: '건성', description: '각질이 많고 당김 증상이 있어요' },
  { value: 'oily', label: '지성', description: '유분기가 많고 번들거려요' },
  { value: 'combination', label: '복합성', description: 'T존은 기름기 있고 볼은 건조해요' },
  { value: 'sensitive', label: '민감성', description: '자극에 쉽게 반응하고 붉어져요' },
];

const concernOptions = [
  { value: 'wrinkles', label: '주름', emoji: '🫠' },
  { value: 'pigmentation', label: '색소침착', emoji: '🟤' },
  { value: 'acne', label: '여드름', emoji: '🔴' },
  { value: 'pores', label: '모공', emoji: '👃' },
  { value: 'redness', label: '홍조', emoji: '🌶️' },
  { value: 'blackheads', label: '블랙헤드', emoji: '⚫' },
  { value: 'dryness', label: '건조함', emoji: '🏜️' },
  { value: 'oiliness', label: '유분기', emoji: '💧' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<OnboardingForm>({
    resolver: zodResolver(onboardingSchema),
    mode: 'onChange',
    defaultValues: {
      concerns: [],
    },
  });

  const selectedConcerns = watch('concerns') || [];

  // 진입 차단 및 상태 검사
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          toast.error('로그인이 필요합니다.');
          router.replace('/login');
          return;
        }

        // 이미 온보딩을 완료했는지 확인
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('skin_type, is_onboarding_done')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('프로필 조회 에러:', profileError);
          // 프로필이 없는 경우는 진행 가능
        } else if (profile?.skin_type && profile?.is_onboarding_done) {
          toast.success('이미 가입이 완료되었습니다!');
          router.replace('/');
          return;
        }
      } catch (error) {
        console.error('상태 확인 에러:', error);
        toast.error('오류가 발생했습니다. 다시 시도해주세요.');
        router.replace('/login');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkUserStatus();
  }, [router, supabase]);

  // 고민 선택 핸들러
  const handleConcernToggle = (concernValue: string) => {
    const currentConcerns = selectedConcerns;
    if (currentConcerns.includes(concernValue)) {
      // 선택 해제
      setValue('concerns', currentConcerns.filter(c => c !== concernValue));
    } else {
      // 선택 추가 (최대 3개 제한)
      if (currentConcerns.length >= 3) {
        toast.error('고민은 최대 3개까지만 선택 가능합니다.');
        return;
      }
      setValue('concerns', [...currentConcerns, concernValue]);
    }
  };

  // 폼 제출 핸들러
  const onSubmit = async (data: OnboardingForm) => {
    setIsSubmitting(true);

    try {
      // 세션 재확인
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error('로그인이 만료되었습니다. 다시 로그인해주세요.');
        router.replace('/login');
        return;
      }

      // DB 업데이트
      const { error } = await supabase
        .from('profiles')
        .update({
          nickname: data.nickname,
          birth_year: parseInt(data.birth_year),
          gender: data.gender,
          skin_type: data.skin_type,
          is_onboarding_done: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('프로필 업데이트 에러:', error);
        toast.error('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }

      // 성공 처리
      toast.success('환영합니다! 웰컴 선물이 도착했어요 🎁');
      router.refresh(); // 전역 상태 갱신
      router.replace('/');

    } catch (error) {
      console.error('온보딩 제출 에러:', error);
      toast.error('네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로딩 중 화면
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#00FFC2] mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white px-4 py-8">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 text-[#00FFC2] text-sm font-semibold tracking-widest uppercase mb-4">
            <Sparkles className="w-4 h-4" />
            Derma AI
          </div>
          <h1 className="text-3xl font-bold mb-2">반가워요! 👋</h1>
          <p className="text-gray-400 text-sm">맞춤형 피부 케어를 위해 몇 가지 정보만 알려주세요</p>
        </motion.div>

        {/* 폼 */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-6"
        >
          {/* 닉네임 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">
              닉네임 *
            </label>
            <input
              {...register('nickname')}
              type="text"
              placeholder="피부천사"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00FFC2] focus:border-transparent transition-all"
            />
            {errors.nickname && (
              <p className="mt-1 text-sm text-red-400">{errors.nickname.message}</p>
            )}
          </div>

          {/* 출생연도 */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-300">
              태어난 연도 *
            </label>
            <input
              {...register('birth_year')}
              type="tel"
              placeholder="1995"
              maxLength={4}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#00FFC2] focus:border-transparent transition-all"
            />
            {errors.birth_year && (
              <p className="mt-1 text-sm text-red-400">{errors.birth_year.message}</p>
            )}
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-300">
              성별 *
            </label>
            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-3">
                  {genderOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        field.value === option.value
                          ? 'border-[#00FFC2] bg-[#00FFC2]/10 text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <div className="text-2xl mb-1">{option.emoji}</div>
                      <div className="text-sm font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.gender && (
              <p className="mt-1 text-sm text-red-400">{errors.gender.message}</p>
            )}
          </div>

          {/* 피부 타입 */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-300">
              피부 타입 *
            </label>
            <Controller
              name="skin_type"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  {skinTypeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => field.onChange(option.value)}
                      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                        field.value === option.value
                          ? 'border-[#00FFC2] bg-[#00FFC2]/10 text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm opacity-70">{option.description}</div>
                        </div>
                        {field.value === option.value && (
                          <Check className="w-5 h-5 text-[#00FFC2]" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            />
            {errors.skin_type && (
              <p className="mt-1 text-sm text-red-400">{errors.skin_type.message}</p>
            )}
          </div>

          {/* 피부 고민 */}
          <div>
            <label className="block text-sm font-semibold mb-3 text-gray-300">
              피부 고민 (최대 3개) *
            </label>
            <Controller
              name="concerns"
              control={control}
              render={({ field }) => (
                <div className="grid grid-cols-2 gap-2">
                  {concernOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleConcernToggle(option.value)}
                      className={`p-3 rounded-xl border-2 transition-all text-center ${
                        selectedConcerns.includes(option.value)
                          ? 'border-[#00FFC2] bg-[#00FFC2]/10 text-white'
                          : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xl mb-1">{option.emoji}</div>
                      <div className="text-xs font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              )}
            />
            {selectedConcerns.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedConcerns.map((concern) => {
                  const option = concernOptions.find(o => o.value === concern);
                  return (
                    <span
                      key={concern}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-[#00FFC2]/20 text-[#00FFC2] text-xs rounded-full"
                    >
                      {option?.emoji} {option?.label}
                    </span>
                  );
                })}
              </div>
            )}
            {errors.concerns && (
              <p className="mt-1 text-sm text-red-400">{errors.concerns.message}</p>
            )}
          </div>

          {/* 제출 버튼 */}
          <motion.button
            type="submit"
            disabled={isSubmitting || !isValid}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-4 bg-gradient-to-r from-[#00FFC2] to-teal-400 text-black font-bold rounded-xl shadow-lg hover:shadow-[0_0_20px_rgba(0,255,194,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                저장 중...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                시작하기
              </>
            )}
          </motion.button>
        </motion.form>
      </div>
    </div>
  );
}
