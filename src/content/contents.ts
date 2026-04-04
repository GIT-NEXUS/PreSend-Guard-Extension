// src/contents.ts
import { PromptMessage } from '../types/index';

console.log('Nexus: 가로채기 모듈 활성화');

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

  console.log('Nexus: 백엔드 분석 요청 중...', userPrompt);

  try {
    // 백엔드(8080) 호출
    const response = await fetch('http://localhost:8080/api/v1/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: userPrompt }) // PromptRequestDto
    });

    if (!response.ok) throw new Error('서버 응답 실패');

    const result = await response.json(); // PromptResponseDto (score, action, maskedText 등)
    console.log('분석 결과 수신:', result);

    // [백엔드 PromptService.java 판정 기준 적용]
    // 1. ALLOW: 위험 요소 없음
    if (result.action === 'ALLOW') {
      console.log('✅ 안전: 전송 허용');
      // 여기에 원래 전송을 실행하는 코드를 추가하면 메시지가 나갑니다.
    } 
    // 2. WARN: score >= 70 (백엔드 로직)
    else if (result.action === 'WARN') {
      alert(
        `🚨 보안 차단 (위험 점수: ${result.score})\n\n` +
        `민감 정보가 너무 많아 전송이 금지되었습니다.\n` +
        `- 전화번호: ${result.phoneCount}건\n- 이메일: ${result.emailCount}건\n- 주민번호: ${result.rrnCount}건`
      );
    } 
    // 3. MASK: score < 70 이지만 PII 존재
    else if (result.action === 'MASK') {
      const userAgreement = confirm(
        `⚠️ 개인정보 주의 (위험 점수: ${result.score})\n\n` +
        `안전하게 마스킹된 내용으로 수정해서 보낼까요?\n\n` +
        `[수정안]: ${result.maskedText}`
      );

      if (userAgreement) {
        inputArea.innerText = result.maskedText;
        console.log('마스킹 텍스트로 교체 완료.');
      }
    }
  } catch (error) {
    console.error('API 통신 에러:', error);
    alert('보안 분석 서버(8080)와 연결할 수 없습니다.');
  }
}