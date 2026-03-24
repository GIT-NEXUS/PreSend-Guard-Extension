
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

  event.stopImmediatePropagation();
  event.preventDefault();

  console.log('가로채기 성공');
  console.log('가로챈 텍스트 내용 :', userPrompt);

   const data = { text: userPrompt };
  console.log('서버 전송 데이터:', data);

  fetch('http://localhost:8080/api/v1/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((result) => {
      console.log('분석 결과:', result);
      // 백엔드 응답: score, action, maskedText, phoneCount, emailCount, rrnCount

      if (result.action === 'ALLOW') {
        console.log('안전: 전송 허용');
        // 다음 단계에서 "원래 전송 재실행" 붙일 수 있음
      } else {
        console.log(' 위험: 전송 차단 유지');
        alert(
          `⚠️ 민감정보 감지로 전송이 차단되었습니다.\n` +
          `score: ${result.score}\n` +
          `phone: ${result.phoneCount}, email: ${result.emailCount}, rrn: ${result.rrnCount}`
        );
      }
    })
    .catch((err) => {
      console.error('API 요청 실패:', err);
      alert('서버 분석 실패. (CORS/서버 상태/경로 확인)');
    });
}