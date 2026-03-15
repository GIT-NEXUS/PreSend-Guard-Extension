
import { PromptMessage } from '../types/index';

console.log( 'Nexus: 가로채기 모듈 활성화');

// 시간 포맷팅 함수 
const getNow = () => {
  const now = new Date();
  return `[${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}]`;
};

const observer = new MutationObserver(() => {
  const sendButton = document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement;
  const inputArea = document.querySelector('#prompt-textarea') as HTMLDivElement;

  // psgHooked  중복 이벤트 방지
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

function handleInterception(event: Event, inputArea: HTMLDivElement) {
  const userPrompt = inputArea?.innerText || '';
  if (!userPrompt.trim()) return;

  // 1. 물리적 전송 차단 (ChatGPT 원래 로직 정지)
  event.stopImmediatePropagation();
  event.preventDefault();

  // 2. 가로채기 성공 로그 
  const timeLabel = getNow();
  console.log(`${timeLabel}  가로채기 성공`);
  console.log("가로챈 텍스트 내용 :", userPrompt); 

  // 3. 분석용 객체 생성 
  const message: PromptMessage = {
    type: 'ANALYZE_PROMPT',
    payload: {
      text: userPrompt,
      userId: 'user_dev',
      timestamp: timeLabel
    }
  };
  
  console.log('분석용 데이터 객체:', message);
  // 4. 분석용 객체를 백그라운드로 전송 (실제 구현에서는 chrome.runtime.sendMessage 등 사용)
}