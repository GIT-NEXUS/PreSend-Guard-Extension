// src/contents.ts
import { PromptMessage } from '../types/index';

//  [수정됨] YYYY:MM:DD:HH:MM:SS 형태로 시간을 만들어주는 함수
const getTimeStamp = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `[${year}:${month}:${day}:${hours}:${minutes}:${seconds}]`;
};

console.log(`${getTimeStamp()} Nexus: 가로채기 모듈 활성화`);

// 1. ChatGPT 입력창 및 버튼 감시
const observer = new MutationObserver(() => {
  const sendButton = document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement;
  const inputArea = document.querySelector('#prompt-textarea') as HTMLDivElement;

  if (sendButton && !sendButton.dataset.psgHooked) {
    injectInterceptor(sendButton, inputArea);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

function injectInterceptor(button: HTMLButtonElement, inputArea: HTMLDivElement) { 
  button.dataset.psgHooked = 'true';

  button.addEventListener('click', (event) => {
    handleInterception(event, inputArea);
  }, true);

  inputArea?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      handleInterception(event, inputArea);
    }
  }, true);
}

// 2. 백엔드 로직 기반 처리 함수
async function handleInterception(event: Event, inputArea: HTMLDivElement) {
  const userPrompt = inputArea?.innerText || '';
  if (!userPrompt.trim()) return;

  // 일단 ChatGPT 전송 막기
  event.stopImmediatePropagation();
  event.preventDefault();

  // 백엔드로 분석 요청
  const requestData = { text: userPrompt } as unknown as PromptMessage;

  console.log(`${getTimeStamp()} Nexus: 백엔드 분석 요청 중...`, requestData);

  try {
    // 백엔드(8080) 호출
    const response = await fetch('http://localhost:8080/api/v1/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestData) // 여기서 데이터 전송!
    });

    if (!response.ok) throw new Error('서버 응답 실패');

    const result = await response.json(); 
    console.log(`${getTimeStamp()} 분석 결과 수신:`, result);

    // 1. ALLOW: 위험 요소 없음
    if (result.action === 'ALLOW') {
      console.log(`${getTimeStamp()}  안전: 전송 허용`);
    } 
    // 2. WARN: score >= 70
    else if (result.action === 'WARN') {
      alert(
        `${getTimeStamp()} 보안 차단 (위험 점수: ${result.score})\n\n` +
        `민감 정보가 너무 많아 전송이 금지되었습니다.\n` +
        `- 전화번호: ${result.phoneCount}건\n- 이메일: ${result.emailCount}건\n- 주민번호: ${result.rrnCount}건`
      );
    } 
    // 3. MASK: score < 70 이지만 PII 존재
    else if (result.action === 'MASK') {
      const userAgreement = confirm(
        `${getTimeStamp()} 개인정보 주의 (위험 점수: ${result.score})\n\n` +
        `안전하게 마스킹된 내용으로 수정해서 보낼까요?\n\n` +
        `[수정안]: ${result.maskedText}`
      );

      if (userAgreement) {
        inputArea.innerText = result.maskedText;
        console.log(`${getTimeStamp()} 마스킹 텍스트로 교체 완료.`);
      }
    }
  } catch (error) {
    console.error(`${getTimeStamp()} API 통신 에러:`, error);
    alert(`${getTimeStamp()} 보안 분석 서버(8080)와 연결할 수 없습니다.`);
  }
}