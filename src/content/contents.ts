console.log('가로채기 모듈 활성화');

interface AnalysisResult {
  score: number;
  action: string;
  maskedText: string;
  phoneCount: number;
  emailCount: number;
  rrnCount: number;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function showOverlay(
  originalText: string,
  result: AnalysisResult,
  onSendOriginal: () => void,
  onSendSanitized: () => void,
  onEdit: () => void
) {
  document.getElementById('psg-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'psg-overlay';

  const tagsHTML = [
    result.phoneCount > 0 ? `<span class="psg-tag-phone">전화번호 ${result.phoneCount}건</span>` : '',
    result.emailCount > 0 ? `<span class="psg-tag-email">이메일 ${result.emailCount}건</span>` : '',
    result.rrnCount > 0   ? `<span class="psg-tag-rrn">주민번호 ${result.rrnCount}건</span>` : '',
  ].join('');

  overlay.innerHTML = `
    <div id="psg-modal">
      <div class="psg-header">
        <div class="psg-dot"></div>
        <p class="psg-title">민감정보 감지됨</p>
        <span class="psg-score">score ${result.score}</span>
      </div>
      <div class="psg-body">
        <div class="psg-tags">${tagsHTML}</div>
        <div class="psg-boxes">
          <div class="psg-box">
            <div class="psg-box-label">원본</div>
            <div class="psg-box-text">${escapeHtml(originalText)}</div>
          </div>
          <div class="psg-box psg-sanitized">
            <div class="psg-box-label">마스킹 후</div>
            <div class="psg-box-text">${escapeHtml(result.maskedText)}</div>
          </div>
        </div>
        <div class="psg-buttons-row">
          <button class="psg-btn-edit" id="psg-btn-edit">✏️ 직접 수정</button>
          <button class="psg-btn-original" id="psg-btn-original">⚡ 원본 전송</button>
        </div>
        <button class="psg-btn-send" id="psg-btn-send">마스킹 후 전송</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById('psg-btn-edit')!.addEventListener('click', () => {
    overlay.remove();
    onEdit();
  });
  document.getElementById('psg-btn-original')!.addEventListener('click', () => {
    overlay.remove();
    onSendOriginal();
  });
  document.getElementById('psg-btn-send')!.addEventListener('click', () => {
    overlay.remove();
    onSendSanitized();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

  function dispatchSend(text: string) {
  const inputArea = document.querySelector('#prompt-textarea') as HTMLDivElement;
  const sendButton = document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement;
  if (!inputArea || !sendButton) return;

  inputArea.focus();
  document.execCommand('selectAll', false);
  document.execCommand('insertText', false, text);

  setTimeout(() => {
    sendButton.dataset.psgSafeSend = 'true';
    
    sendButton.click();
    
    setTimeout(() => { 
      sendButton.dataset.psgSafeSend = 'false'; 
    }, 100);
  }, 80);
}

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
  const sendButton = document.querySelector('button[data-testid="send-button"]') as HTMLButtonElement;
  

  if (sendButton?.dataset.psgSafeSend === 'true') {
    return; 
  }

  const userPrompt = inputArea?.innerText || '';
  if (!userPrompt.trim()) return;

  // 가로채기 시작
  event.stopImmediatePropagation();
  event.preventDefault();

  console.log('가로채기 성공');
  console.log('가로챈 텍스트 내용 :', userPrompt);

  fetch('http://localhost:8080/api/v1/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: userPrompt }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    })
    .then((result: AnalysisResult) => {
      console.log('분석 결과:', result);

      if (result.action === 'ALLOW') {
        console.log('안전: 전송 허용');
        dispatchSend(userPrompt);
      } else {
        console.log('위험: 팝업 표시');
        showOverlay(
          userPrompt,
          result,
          () => dispatchSend(userPrompt),       // 원본 전송
          () => dispatchSend(result.maskedText), // 마스킹 전송
          () => {} // 직접 수정 (모달만 닫힘)
        );
      }
    })
    .catch((err) => {
      console.error('API 요청 실패:', err);
      alert('서버 분석 실패. (CORS/서버 상태/경로 확인)');
    });
}