const DIARY_MAX_LENGTH = 500;

document.addEventListener('DOMContentLoaded', () => {
  const dateLabel = document.querySelector('time') as HTMLTimeElement;
  const textArea = document.querySelector('#diary') as HTMLTextAreaElement;
  const lengthCounter = document.querySelector(
    '.length-counter',
  ) as HTMLSpanElement;
  const saveButton = document.querySelector(
    '.save-button',
  ) as HTMLButtonElement;

  // 날짜 표시
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();

  dateLabel.dateTime = currentDate.toISOString();
  dateLabel.textContent = `${year}/${month}/${day}`;

  // textarea 길이 카운터
  textArea.addEventListener('input', () => {
    const currentLength = textArea.value.length;

    if (currentLength > DIARY_MAX_LENGTH) {
      return;
    }

    lengthCounter.textContent = `${currentLength} / ${DIARY_MAX_LENGTH}`;
  });

  // 저장 버튼 이벤트
  saveButton.addEventListener('click', async () => {
    const diaryContent = textArea.value.trim();

    if (diaryContent.length === 0) {
      alert('일기를 작성해주세요.');
      return;
    }

    try {
      // 일기 내용 로컬 스토리지에 저장
      localStorage.setItem('diary', diaryContent);
      console.log('일기가 저장되었습니다.');

      // 버튼 비활성화 (중복 클릭 방지)
      saveButton.disabled = true;
      saveButton.textContent = '처리 중...';

      // 음악 컴포넌트 페이지로 이동 (from_diary 파라미터 추가)
      window.location.href = '/src/pages/MusicComponent.html?from_diary=true';
    } catch (error) {
      console.error('일기 저장 중 오류 발생:', error);
      alert('일기 저장 중 오류가 발생했습니다.');

      // 버튼 상태 복원
      saveButton.disabled = false;
      saveButton.textContent = '작성 완료';
    }
  });
});
