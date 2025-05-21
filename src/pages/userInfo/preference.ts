import { IMAGE_PREFERENCES, MUSIC_PREFERENCES } from '../../data/preference';

const container = document.getElementById('preference-container');
const notice = document.getElementById('notice');

type Step = 'picture' | 'music';

let step: Step = 'picture';

/**
 * 로컬스토리지에 저장된 프로필 정보를 업데이트합니다.
 *
 * @param {Partial<Record<string, any>>} updates - 업데이트할 프로필 키와 값
 */
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

/**
 * 로컬스토리지의 프로필 정보에서 특정 키 또는 키 목록을 제거합니다.
 *
 * @param {string | string[]} keys - 제거할 프로필 키 또는 키 목록
 */
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

/**
 * 현재 단계에 따라 그림 또는 음악 취향 선택 UI를 렌더링합니다.
 *
 * @param {Step} step - 'picture' 또는 'music' 단계
 */
function renderPreferences(step: Step) {
  container!.innerHTML = '';
  notice!.innerHTML =
    step === 'picture'
      ? '그림 취향을 선택해주세요<br />선택하신 취향을 바탕으로 어울리는 이미지를 만들어 드려요'
      : '음악 취향을 선택해주세요<br />선택하신 취향을 바탕으로 어울리는 음악을 추천해 드려요';

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

/**
 * 사용자 선택을 처리하고, 다음 단계로 넘어가거나 일기 페이지로 이동합니다.
 *
 * @param {string} selectedValue - 사용자가 선택한 취향 값
 */
function handleSelect(selectedValue: string) {
  if (step === 'picture') {
    updateProfile({ pictureKeyword: selectedValue });
    step = 'music';
    renderPreferences('music');
  } else {
    updateProfile({ musicKeyword: selectedValue });
    window.location.href = '/src/pages/diary.html';
  }
}

// 초기 그림 취향 렌더링
renderPreferences('picture');

// '건너뛰기' 버튼 클릭 시 프로필 초기화 후 일기 페이지로 이동
const skipBtn = document.getElementById('skip') as HTMLSpanElement;
skipBtn?.addEventListener('click', () => {
  removeFromProfile(['pictureKeyword', 'musicKeyword']);
  window.location.href = '/src/pages/diary.html';
});

// '뒤로가기' 버튼 클릭 시 프로필 초기화 후 직업 선택 페이지로 이동
const backBtn = document.getElementById('back') as HTMLButtonElement;
backBtn?.addEventListener('click', () => {
  removeFromProfile(['pictureKeyword', 'musicKeyword']);
  window.location.href = '/src/pages/userInfo/job.html';
});
