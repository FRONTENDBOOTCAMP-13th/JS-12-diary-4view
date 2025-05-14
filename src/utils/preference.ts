import { IMAGE_PREFERENCES, MUSIC_PREFERENCES } from '../data/preference';

const container = document.getElementById('preference-container');
const notice = document.getElementById('notice');

type Step = 'picture' | 'music';

let step: Step = 'picture';

function updateProfile(updates: Partial<Record<string, any>>) {
  try {
    const profileStr = localStorage.getItem('profile');
    const profile = profileStr ? JSON.parse(profileStr) : {};

    const updatedProfile = { ...profile, ...updates };

    localStorage.setItem('profile', JSON.stringify(updatedProfile));
  } catch (error) {
    console.error('localstorage 업데이트중 에러: ', error);
  }
}

function removeFromProfile(keys: string | string[]) {
  try {
    const profileStr = localStorage.getItem('profile');
    if (!profileStr) return;

    const profile = JSON.parse(profileStr);

    if (Array.isArray(keys)) {
      keys.forEach(key => delete profile[key]);
    } else {
      delete profile[keys];
    }

    localStorage.setItem('profile', JSON.stringify(profile));
  } catch (error) {
    console.error('localstorage 제거중 에러: ', error);
  }
}

// function saveToLocalStorage(key: string, value: string) {
//   localStorage.setItem(key, value);
// }

// function clearFromStorage() {
//   localStorage.removeItem('pictureKeyword');
//   localStorage.removeItem('musicKeyword');
// }

function renderPreferences(step: Step) {
  container!.innerHTML = '';
  notice!.innerHTML =
    step === 'picture'
      ? '그림 취향을 선택해주세요<br />선택하신 취향을 바탕으로 어울리는 이미지를 만들어 드려요'
      : '음악 취향을 선택해주세요<br />선택하신 취향을 바탕으로 어울리는 음악울 추천해 드려요';

  const preferences =
    step === 'picture' ? IMAGE_PREFERENCES : MUSIC_PREFERENCES;

  preferences.forEach(pref => {
    const card = document.createElement('figure');
    card.className = 'flex flex-col items-center gap-3 cursor-pointer m-0';
    card.innerHTML = /* html */ `
      <img src="${pref.imageUrl}" alt="${pref.name}" class="w-20 h-20 rounded-full" />
      <span class="paragraph-medium">${pref.name}</span>
    `;
    card.addEventListener('click', () => handleSelect(pref.name));
    container!.appendChild(card);
  });
}

function handleSelect(selectedValue: string) {
  if (step === 'picture') {
    updateProfile({ pictureKeyword: selectedValue });
    step = 'music';
    renderPreferences('music');
  } else {
    updateProfile({ musicKeyword: selectedValue });
    //TODO: 다음 페이지로 이동
  }
}

renderPreferences('picture');

const skipBtn = document.getElementById('skip') as HTMLSpanElement;
skipBtn?.addEventListener('click', () => {
  removeFromProfile(['pictureKeyword', 'musicKeyword']);
  //TODO: 다음 페이지로 이동
});

const backBtn = document.getElementById('back') as HTMLButtonElement;
backBtn?.addEventListener('click', () => {
  removeFromProfile(['pictureKeyword', 'musicKeyword']);
  window.location.href = '/src/pages/userInfo/job.html';
  // window.history.back();
});
