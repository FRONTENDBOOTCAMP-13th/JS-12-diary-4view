import '/src/style.css';

document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.querySelector('#back') as HTMLButtonElement;

  backButton.addEventListener('click', () => {
    window.history.back();
  });

  const form = document.getElementById('profile-form') as HTMLFormElement;

  form.addEventListener('submit', event => {
    event.preventDefault();

    const nicknameInput = document.getElementById(
      'nickname',
    ) as HTMLInputElement;
    const ageInput = document.getElementById('age') as HTMLInputElement;

    const nickname = nicknameInput.value.trim();
    const age = ageInput.value.trim();

    if (!isNicknameValid(nickname)) {
      alert('닉네임은 2~11자 내로 작성해주세요.');
      nicknameInput.focus();
      return;
    }

    const ageValidation = isAgeValid(age);

    if (ageValidation.result === false) {
      alert(ageValidation.message);
      ageInput.focus();
      return;
    }

    const profile = {
      nickname,
      age,
    };

    localStorage.setItem('profile', JSON.stringify(profile));

    window.location.href = '/src/pages/userInfo/job.html';
  });
});

// 닉네임 유효성 검사
function isNicknameValid(nickname: string): boolean {
  console.log(nickname.length);
  if (nickname.length < 2 || nickname.length > 11) {
    return false;
  }

  return true;
}

// 나이 유효성 검사
function isAgeValid(age: string): { result: boolean; message: string } {
  // age에 문자가 포함되어 있는지 검사
  for (const char of age) {
    if (isNaN(Number(char))) {
      return { result: false, message: '나이는 숫자만 입력해주세요.' };
    }
  }

  // age의 범위 검사
  if (Number(age) < 0 || Number(age) > 99) {
    return { result: false, message: '나이는 0~99세 사이로 입력해주세요.' };
  }

  return { result: true, message: '' };
}
