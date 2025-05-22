import '/src/style.css';

document.addEventListener('DOMContentLoaded', () => {
  // 뒤로가기 버튼
  const backButton = document.querySelector('#back') as HTMLButtonElement;
  backButton.addEventListener('click', () => {
    window.history.back();
  });

  // form 요소에 제출 시 이벤트 리스너 추가
  const form = document.getElementById('profile-form') as HTMLFormElement;

  form.addEventListener('submit', event => {
    profileValidCheck(event, '/src/pages/userInfo/job.html');
  });

  // 상단 job 페이지 링크에 이벤트 리스너 추가
  const jobPageLink = document.querySelector(
    '#to-job-page',
  ) as HTMLAnchorElement;
  jobPageLink.addEventListener('click', event => {
    profileValidCheck(event, '/src/pages/userInfo/job.html');
  });

  // 상단 preference 페이지 링크에 이벤트 리스너 추가
  const preferencePageLink = document.querySelector(
    '#to-preference-page',
  ) as HTMLAnchorElement;
  preferencePageLink.addEventListener('click', event => {
    profileValidCheck(event, '/src/pages/userInfo/preference.html');
  });

  // dom loaded 시 localStorage에 저장된 프로필 정보 불러오기
  const nicknameInput = document.getElementById('nickname') as HTMLInputElement;
  const ageInput = document.getElementById('age') as HTMLInputElement;
  const profile = localStorage.getItem('profile');
  if (profile) {
    try {
      const { nickname, age } = JSON.parse(profile);
      nicknameInput.value = nickname;
      ageInput.value = age;
    } catch (err) {
      console.warn('프로필 정보 불러오기 실패 :', err);
    }
  }
});

const profileValidCheck = function (event: Event, link: string) {
  const form = document.getElementById('profile-form') as HTMLFormElement;

  // 브라우저 기본 검증을 유도
  if (!form.checkValidity()) {
    form.reportValidity();
    event.preventDefault();
    return;
  }

  const nicknameInput = document.getElementById('nickname') as HTMLInputElement;
  const ageInput = document.getElementById('age') as HTMLInputElement;

  const nickname = nicknameInput.value.trim();
  const age = ageInput.value.trim();

  const profile = {
    nickname,
    age,
  };

  localStorage.setItem('profile', JSON.stringify(profile));

  window.location.href = link;
};
