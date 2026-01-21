// 'use client';

// import React, { useEffect, useMemo, useRef, useState } from 'react';

// type SurpriseHotDealTimerProps = {
//   /** 종료 시각(카운트다운). 예: "2026-01-20T23:59:59+09:00" */
//   endAt?: Date | string;
//   /** 남은 시간(초)로 시작(카운트다운). endAt보다 우선순위 낮음 */
//   durationSeconds?: number;
//   /** 컨테이너 추가 클래스 */
//   className?: string;
// };

// function pad2(n: number) {
//   return String(Math.max(0, n)).padStart(2, '0');
// }

// export default function SurpriseHotDealTimer({
//   endAt,
//   durationSeconds = 12 * 3600 + 54 * 60 + 12,
//   className = '',
// }: SurpriseHotDealTimerProps) {
//   const endMs = useMemo(() => {
//     if (!endAt) return null;
//     const d = typeof endAt === 'string' ? new Date(endAt) : endAt;
//     const t = d.getTime();
//     return Number.isFinite(t) ? t : null;
//   }, [endAt]);

//   const startMsRef = useRef<number | null>(null);
//   const [remainSec, setRemainSec] = useState<number>(() => {
//     if (endMs != null) return Math.max(0, Math.floor((endMs - Date.now()) / 1000));
//     return Math.max(0, Math.floor(durationSeconds));
//   });

//   useEffect(() => {
//     // 초기화
//     startMsRef.current = Date.now();

//     const tick = () => {
//       let sec: number;

//       if (endMs != null) {
//         sec = Math.floor((endMs - Date.now()) / 1000);
//       } else {
//         const startMs = startMsRef.current ?? Date.now();
//         const elapsed = Math.floor((Date.now() - startMs) / 1000);
//         sec = Math.floor(durationSeconds) - elapsed;
//       }

//       setRemainSec(Math.max(0, sec));
//     };

//     tick();
//     const id = window.setInterval(tick, 1000);
//     return () => window.clearInterval(id);
//   }, [endMs, durationSeconds]);

//   const hours = Math.floor(remainSec / 3600);
//   const minutes = Math.floor((remainSec % 3600) / 60);
//   const seconds = remainSec % 60;

//   return (
//     <div className={`w-fit ${className}`}>
//       {/* 상단 문구(고정) */}
//       <div className="flex items-center justify-center gap-2">
//         <ClockIcon className="h-6 w-6 text-orange-500" />
//         <span className="text-[22px] font-extrabold tracking-[-0.02em] text-neutral-900">
//           기간 한정 <span className="text-orange-500">서프라이즈 핫딜!</span>
//         </span>
//       </div>

//       {/* 타이머 */}
//       <div className="mt-3 flex items-start justify-center gap-3">
//         <TimeBlock value={pad2(hours)} label="시간" />
//         <Colon />
//         <TimeBlock value={pad2(minutes)} label="분" />
//         <Colon />
//         <TimeBlock value={pad2(seconds)} label="초" />
//       </div>
//     </div>
//   );
// }

// function TimeBlock({ value, label }: { value: string; label: string }) {
//   return (
//     <div className="flex flex-col items-center">
//       <div className="flex h-[54px] w-[54px] items-center justify-center rounded-[14px] bg-orange-50">
//         <span className="text-[22px] font-extrabold text-orange-500">{value}</span>
//       </div>
//       <span className="mt-2 text-[12px] font-semibold text-neutral-900">{label}</span>
//     </div>
//   );
// }

// function Colon() {
//   return (
//     <div className="flex h-[54px] items-center justify-center">
//       <span className="text-[22px] font-extrabold leading-none text-orange-500">:</span>
//     </div>
//   );
// }

// function ClockIcon({ className = '' }: { className?: string }) {
//   return (
//     <svg
//       className={className}
//       viewBox="0 0 24 24"
//       fill="none"
//       aria-hidden="true"
//     >
//       {/* 좌측 “스피드 라인” 느낌 */}
//       <path d="M4 7h5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
//       <path d="M3 11h4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
//       <path d="M4 15h5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />

//       {/* 시계 */}
//       <path
//         d="M14 4.5a7.5 7.5 0 1 1 0 15a7.5 7.5 0 0 1 0-15Z"
//         stroke="currentColor"
//         strokeWidth="2.4"
//       />
//       <path
//         d="M14 8v4l2.5 1.5"
//         stroke="currentColor"
//         strokeWidth="2.4"
//         strokeLinecap="round"
//         strokeLinejoin="round"
//       />
//     </svg>
//   );
// }
