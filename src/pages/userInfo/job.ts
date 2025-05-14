const jobs: string[] = [
  '개발자',
  '강사',
  '디자이너',
  '운동선수',
  '의사',
  '마케터',
  '영업직',
  '기자',
  '학생',
  '변호사',
  '작가',
  '교수',
  '요리사',
  '간호사',
  '경찰',
  '군인',
  '공무원',
  '기타',
];

const ITEMS_PER_PAGE = 9;
const TOTAL_SLIDES = 2;
let currentPage = 0;

const jobSlider = document.getElementById('job-slider') as HTMLDivElement;
const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement;
const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;

function renderSlides() {
  jobSlider.innerHTML = '';

  for (let i = 0; i < TOTAL_SLIDES; i++) {
    const slide = document.createElement('div');
    slide.className =
      'flex-none w-full grid grid-cols-3 gap-1 text-[var(--color-khaki)]';

    const start = i * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageJobs = jobs.slice(start, end);

    pageJobs.forEach(job => {
      const a = document.createElement('a');
      a.href = 'taste.html';
      a.textContent = job;
      a.className =
        'rounded-lg aspect-square bg-[var(--color-secondary-color)] cursor-pointer flex items-center justify-center';
      slide.appendChild(a);
    });

    jobSlider.appendChild(slide);
  }
}

function moveSlide(direction: number) {
  if (direction === -1 && currentPage === 0) return;
  if (direction === 1 && currentPage === 2) return;

  currentPage += direction;
  jobSlider.style.transform = `translateX(-${currentPage * 100}%)`;
}

prevBtn.addEventListener('click', () => moveSlide(-1));
nextBtn.addEventListener('click', () => moveSlide(1));

// 초기 실행
renderSlides();
