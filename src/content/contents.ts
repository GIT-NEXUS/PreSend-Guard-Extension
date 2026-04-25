console.log('가로채기 모듈 활성화');

// ────────────────────────────────────────────────────────────
// 오버레이 UI 주입
// ────────────────────────────────────────────────────────────
function injectOverlayStyles() {
  if (document.getElementById('psg-styles')) return;
  const style = document.createElement('style');
  style.id = 'psg-styles';
  style.textContent = `
    #psg-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.45);
      backdrop-filter: blur(3px);
      z-index: 999999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: psg-fade-in 0.18s ease;
    }
    @keyframes psg-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    #psg-modal {
      background: #1e1e2e;
      border: 1px solid #3a3a5c;
      border-radius: 16px;
      padding: 24px;
      width: 480px;
      max-width: 92vw;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
      font-family: 'Segoe UI', sans-serif;
      color: #e0e0f0;
      animation: psg-slide-up 0.22s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes psg-slide-up {
      from { transform: translateY(24px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    #psg-modal .psg-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 18px;
    }
    #psg-modal .psg-header .psg-icon {
      font-size: 22px;
    }
    #psg-modal .psg-header h2 {
      margin: 0;
      font-size: 15px;
      font-weight: 700;
      color: #f0c040;
      letter-spacing: 0.02em;
    }
    #psg-modal .psg-header .psg-badge {
      margin-left: auto;
      background: #f0c04022;
      border: 1px solid #f0c04066;
      color: #f0c040;
      font-size: 11px;
      padding: 2px 10px;
      border-radius: 20px;
      font-weight: 600;
    }
    #psg-modal .psg-boxes {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }
    #psg-modal .psg-box {
      background: #13131f;
      border: 1px solid #2e2e4a;
      border-radius: 10px;
      padding: 12px;
    }
    #psg-modal .psg-box .psg-box-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #7070a0;
      margin-bottom: 8px;
    }
    #psg-modal .psg-box .psg-box-text {
      font-size: 13px;
      line-height: 1.55;
      color: #c8c8e8;
      word-break: break-all;
    }
    #psg-modal .psg-box.psg-sanitized .psg-box-text {
      color: #6be8a0;
    }
    #psg-modal .psg-stats {
      display: flex;
      gap: 8px;
      margin-bottom: 18px;
    }
    #psg-modal .psg-stat {
      background: #ff445522;
      border: 1px solid #ff445544;
      border-radius: 8px;
      padding: 4px 12px;
      font-size: 12px;
      color: #ff8888;
      font-weight: 600;
    }
    #psg-modal .psg-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }
    #psg-modal button {
      padding: 10px 0;
      border-radius: 8px;
      border: none;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s, transform 0.1s;
    }
    #psg-modal button:hover {
      opacity: 0.88;
      transform: translateY(-1px);
    }
    #psg-modal button:active {
      transform: translateY(0);
    }
    #psg-modal .psg-btn-edit {
      background: #2e2e4a;
      color: #a0a0d0;
      border: 1px solid #3a3a5c;
    }
    #psg-modal .psg-btn-original {
      background: #2e2e4a;
      color: #a0a0d0;
      border: 1px solid #3a3a5c;
    }
    #psg-modal .psg-btn-send {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #4f8cff, #6be8a0);
      color: #0e0e1a;
      font-size: 14px;
    }
  `;
  document.head.appendChild(style);
}

interface AnalysisResult {
  score: number;
  action: string;
  maskedText: string;
  phoneCount: number;
  emailCount: number;
  rrnCount: number;
}

function showOverlay(
  originalText: string,
  result: AnalysisResult,
  onSendOriginal: () => void,
  onSendSanitized: () => void,
  onEdit: () => void
) {
  injectOverlayStyles();

  // 기존 오버레이 제거
  document.getElementById('psg-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'psg-overlay';

  // 통계 배지
  const stats: string[] = [];
  if (result.phoneCount > 0) stats.push(`📞 전화번호 ${result.phoneCount}건`);
  if (result.emailCount > 0) stats.push(`✉️ 이메일 ${result.emailCount}건`);
  if (result.rrnCount > 0)   stats.push(`🪪 주민번호 ${result.rrnCount}건`);

  const statsHTML = stats
    .map(s => `<div class="psg-stat">${s}</div>`)
    .join('');

  overlay.innerHTML = `
    <div id="psg-modal">
      <div class="psg-header">
        <span class="psg-icon">🛡️</span>
        <h2>PreSend Guard — 민감정보 감지</h2>
        <span class="psg-badge">score ${result.score}</span>
      </div>

      <div class="psg-stats">${statsHTML}</div>

      <div class="psg-boxes">
        <div class="psg-box">
          <div class="psg-box-label">Original Text</div>
          <div class="psg-box-text">${escapeHtml(originalText)}</div>
        </div>
        <div class="psg-box psg-sanitized">
          <div class="psg-box-label">Sanitized Text</div>
          <div class="psg-box-text">${escapeHtml(result.maskedText)}</div>
        </div>
      </div>

      <div class="psg-buttons">
        <button class="psg-btn-edit" id="psg-btn-edit">✏️ Edit Manually</button>
        <button class="psg-btn-original" id="psg-btn-original">⚡ Send Original / Ignore</button>
        <button class="psg-btn-send" id="psg-btn-send">✅ Send Sanitized Prompt</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // 버튼 이벤트
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

  // 배경 클릭 시 닫기
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

// ────────────────────────────────────────────────────────────
// 실제 전송 함수
// ────────────────────────────────────────────────────────────
function dispatchSend(text: string) {
  const inputArea = document.querySelector('#prompt-textarea') as HTMLDivElement;
  if (!inputArea) return;

  // 텍스트 교체
  inputArea.focus();
  document.execCommand('selectAll', false);
  document.execCommand('insertText', false, text);

  // 약간의 딜레이 후 실제 전송 버튼 클릭
  setTimeout(() => {
    const sendButton = document.querySelector(
      'button[data-testid="send-button"]'
    ) as HTMLButtonElement;
    if (sendButton) {
      sendButton.dataset.psgHooked = ''; // 훅 임시 해제
      sendButton.click();
      setTimeout(() => { sendButton.dataset.psgHooked = 'true'; }, 300);
    }
  }, 80);
}

// ────────────────────────────────────────────────────────────
// 인터셉터
// ────────────────────────────────────────────────────────────
const observer = new MutationObserver(() => {
  const sendButton = document.querySelector(
    'button[data-testid="send-button"]'
  ) as HTMLButtonElement;
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

  console.log('가로채기 성공:', userPrompt);

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
          // Send Original
          () => dispatchSend(userPrompt),
          // Send Sanitized
          () => dispatchSend(result.maskedText),
          // Edit Manually - 그냥 닫기 (사용자가 직접 수정)
          () => {}
        );
      }
    })
    .catch((err) => {
      console.error('API 요청 실패:', err);
      // 서버 오류 시 그냥 통과
      dispatchSend(userPrompt);
    });
}