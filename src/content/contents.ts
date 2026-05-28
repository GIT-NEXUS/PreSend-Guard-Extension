console.log('가로채기 모듈 활성화');

// 백엔드(Python)에서 snake_case로 올 경우를 대비해 두 가지 타입 모두 허용하도록 안전장치 추가
interface AnalysisResult {
  score: number;
  action: string;
  maskedText: string;
  phoneCount?: number; phone_count?: number;
  emailCount?: number; email_count?: number;
  rrnCount?: number; rrn_count?: number;
  personCount?: number; person_count?: number;
  orgCount?: number; org_count?: number;
  locCount?: number; loc_count?: number;
  jobCount?: number; job_count?: number;
}

// 💡 추후 브랜딩 페이지 연동을 위한 함수 (로그인 토큰이나 크롬 스토리지에서 이메일을 가져옵니다)
async function getCurrentUserEmail(): Promise<string> {
  // 실제 연동 시에는 아래 주석처럼 크롬 스토리지에서 가져오는 로직으로 교체하시면 됩니다.
  // const data = await chrome.storage.local.get('userEmail');
  // return data.userEmail || "anonymous_user";
  
  // 지금은 프론트엔드-대시보드 연동 테스트를 위해 임시 식별자를 리턴합니다.
  return "test_user_from_branding@g.hongik.ac.kr"; 
}

async function sendLogToServer(maskedText: string, result: AnalysisResult, finalVerdict: string) {
  // 안전장치 적용 (어떤 이름표로 오든 숫자 0으로 매핑)
  const phoneCnt = result.phoneCount || result.phone_count || 0;
  const emailCnt = result.emailCount || result.email_count || 0;
  const rrnCnt = result.rrnCount || result.rrn_count || 0;
  const personCnt = result.personCount || result.person_count || 0;
  const orgCnt = result.orgCount || result.org_count || 0;
  const locCnt = result.locCount || result.loc_count || 0;
  const jobCnt = result.jobCount || result.job_count || 0;

  const reasonsArr: string[] = [];
  if (phoneCnt > 0) reasonsArr.push('전화번호');
  if (emailCnt > 0) reasonsArr.push('이메일');
  if (rrnCnt > 0) reasonsArr.push('주민번호');
  if (personCnt > 0) reasonsArr.push('개인명');
  if (orgCnt > 0) reasonsArr.push('기관명/소속');
  if (locCnt > 0) reasonsArr.push('지역명');
  if (jobCnt > 0) reasonsArr.push('직업/직위');

  // 위에서 만든 동적 이메일 획득 함수 호출
  const currentUser = await getCurrentUserEmail();

  try {
    
    await fetch('http://localhost:8081/api/prompt/log', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: maskedText, 
        reasons: reasonsArr.join(', '), 
        riskScore: result.score,
        verdict: finalVerdict,
        userId: currentUser // 동적으로 가져온 이메일(아이디) 적재
      })
    });
    console.log(`[DB 적재 완료] Verdict: ${finalVerdict}, User: ${currentUser}`);
  } catch (err) {
    console.error('DB 적재 API 요청 실패:', err);
  }
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

  const phoneCnt = result.phoneCount || result.phone_count || 0;
  const emailCnt = result.emailCount || result.email_count || 0;
  const rrnCnt = result.rrnCount || result.rrn_count || 0;
  const personCnt = result.personCount || result.person_count || 0;
  const orgCnt = result.orgCount || result.org_count || 0;
  const locCnt = result.locCount || result.loc_count || 0;
  const jobCnt = result.jobCount || result.job_count || 0;


  const tagsHTML = [
    phoneCnt > 0 ? `<span class="psg-tag psg-tag-phone">전화번호 ${phoneCnt}건</span>` : '',
    emailCnt > 0 ? `<span class="psg-tag psg-tag-email">이메일 ${emailCnt}건</span>` : '',
    rrnCnt > 0   ? `<span class="psg-tag psg-tag-rrn">주민번호 ${rrnCnt}건</span>` : '',
    personCnt > 0 ? `<span class="psg-tag psg-tag-per">이름 ${personCnt}건</span>` : '',
    orgCnt > 0    ? `<span class="psg-tag psg-tag-org">소속 ${orgCnt}건</span>` : '',
    locCnt > 0    ? `<span class="psg-tag psg-tag-loc">지역 ${locCnt}건</span>` : '',
    jobCnt > 0    ? `<span class="psg-tag psg-tag-job">직위 ${jobCnt}건</span>` : '',
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

  
  fetch('http://localhost:8000/analyze', {
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
          () => {
            //  사용자가 '원본 전송'을 누르면 DB에도 WARN으로 기록하고 실제 전송합니다.
            sendLogToServer(userPrompt, result, 'WARN');
            dispatchSend(userPrompt);
          }, 
          () => {
            //  사용자가 '마스킹 전송'을 누르면 DB에도 MASK로 기록하고 마스킹 데이터를 전송합니다.
            sendLogToServer(result.maskedText, result, 'MASK');
            dispatchSend(result.maskedText);
          }, 
          () => {
            // 직접 수정 시에는 팝업만 닫힙니다.
          }
        );
      }
    })
    .catch((err) => {
      console.error('API 요청 실패:', err);
      alert('서버 분석 실패. (CORS/서버 상태/경로 확인)');
    });
}