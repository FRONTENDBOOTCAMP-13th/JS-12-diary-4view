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
  saveButton.addEventListener('click', () => {
    const diaryContent = textArea.value.trim();

    if (diaryContent.length === 0) {
      alert('일기를 작성해주세요.');
      return;
    }

    localStorage.setItem('diary', diaryContent);
    window.location.href = '/src/pages/result.html';

    // 로딩 + gpt 요청
  });
});
