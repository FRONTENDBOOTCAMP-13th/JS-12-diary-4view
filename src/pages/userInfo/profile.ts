import '/src/style.css';

document.addEventListener('DOMContentLoaded', () => {
  const backButton = document.querySelector('#back') as HTMLButtonElement;

  backButton.addEventListener('click', () => {
    window.history.back();
  });

  const form = document.getElementById('profile-form') as HTMLFormElement;

  form.addEventListener('submit', event => {
    profileValidCheck(event, '/src/pages/userInfo/job.html');
  });

  const jobPageLink = document.querySelector(
    '#to-job-page',
  ) as HTMLAnchorElement;
  jobPageLink.addEventListener('click', event => {
    profileValidCheck(event, '/src/pages/userInfo/job.html');
  });

  const preferencePageLink = document.querySelector(
    '#to-preference-page',
  ) as HTMLAnchorElement;
  preferencePageLink.addEventListener('click', event => {
    profileValidCheck(event, '/src/pages/userInfo/preference.html');
  });
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
