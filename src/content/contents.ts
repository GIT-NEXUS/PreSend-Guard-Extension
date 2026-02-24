
import { PromptMessage } from '../types/index';

console.log('가로채기 모듈 활성화');

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

function handleInterception(event: Event, inputArea: HTMLDivElement) {
  const userPrompt = inputArea?.innerText || '';
  if (!userPrompt.trim()) return;

  // 물리적 전송 차단
  event.stopImmediatePropagation();
  event.preventDefault();

  // 가로챈 텍스트를 출력
  console.log("가로채기 성공");
  console.log("가로챈 텍스트 내용 :", userPrompt); 

  const message: PromptMessage = {
    type: 'ANALYZE_PROMPT',
    payload: {
      text: userPrompt,
      userId: 'user_dev' 
    }
  };

  // 객체 전체 구조(확인용)
  console.log('분석용 데이터 객체:', message);
}