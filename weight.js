import { app } from "./firebase.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);

// 상태 변수
let records = [];
let chart = null;
let yearChart = null;
let allChart = null;

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 애니메이션 옵션
const ANIMATION_CONFIG = {
  x: {
    type: 'number',
    easing: 'linear',
    duration: 1000,
    from: NaN,
    delay(ctx) {
      if (ctx.type !== 'data' || ctx.xStarted) {
        return 0;
      }
      ctx.xStarted = true;
      return ctx.index * 60;
    }
  },
  y: {
    type: 'number',
    easing: 'easeOutQuart',
    duration: 800
  }
};

/* =========================================================
   공통 차트 옵션
========================================================= */
const COMMON_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true, // 원래대로 true 유지 (PC 무한 늘어남 방지)
  aspectRatio: window.innerWidth <= 600 ? 1.1 : 1.8, // 스마트폰(600px 이하)은 1.2 (세로로 길어짐), PC는 1.8 유지
  animation: ANIMATION_CONFIG,
  layout: {
    padding: {
      left: 0,
      right: 15,
      top: 10,
      bottom: 0
    }
  },
  scales: {
    x: {
      grid: {
        drawBorder: false
      },
      ticks: {
        font: { size: 10 },
        maxRotation: 0,
        autoSkip: true
      }
    },
    y: {
      beginAtZero: false,
      grace: '10%',
      ticks: {
        font: { size: 10 }
      }
    }
  }
};

// DOM 요소 참조
const elements = {
  monthTitle: document.getElementById("monthTitle"),
  monthCtx: document.getElementById("weightChart"),
  weightList: document.getElementById("weightList"),
  monthlyView: document.getElementById("monthlyView"),
  monthlyBtn: document.getElementById("monthlyBtn"),
  
  yearTitle: document.getElementById("yearTitle"),
  yearCtx: document.getElementById("yearWeightChart"),
  yearWeightList: document.getElementById("yearWeightList"),
  yearlyView: document.getElementById("yearlyView"),
  yearlyBtn: document.getElementById("yearlyBtn"),

  allCtx: document.getElementById("allWeightChart"),
  allWeightList: document.getElementById("allWeightList"),
  allView: document.getElementById("allView"),
  allBtn: document.getElementById("allBtn")
};

// 현재 날짜 상태
const params = new URLSearchParams(location.search);
const monthParam = params.get("month");

let currentDate = monthParam ? new Date(`${monthParam}-01`) : new Date();
let currentYear = currentDate.getFullYear();

/* =========================
   Chart.js 플러그인
========================= */
const averageLabelPlugin = {
  id: "averageLabel",
  afterDatasetsDraw(chart) {
    const dataset = chart.data.datasets[1];
    if (!dataset || !dataset.data || !dataset.data.length) return;

    const meta = chart.getDatasetMeta(1);
    if (!meta.data || !meta.data.length) return;

    const point = meta.data[meta.data.length - 1];
    if (!point) return;

    const value = dataset.data[dataset.data.length - 1];
    if (value === null || value === undefined) return;

    const { ctx, chartArea } = chart;

    ctx.save();
    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`평균 ${Number(value).toFixed(1)}kg`, chartArea.left + 5, point.y);
    ctx.restore();
  }
};

/* =========================
   데이터 로드
========================= */
async function loadRecords() {
  try {
    const snapshot = await getDocs(collection(db, "records"));
    
    records = [];
    snapshot.forEach((doc) => records.push(doc.data()));
    
    records.sort((a, b) => new Date(a.date) - new Date(b.date));

    // 기본 월간 뷰 그리기
    drawWeight();
  } catch (error) {
    console.error("데이터를 가져오는 중 오류 발생:", error);
  }
}

/* =========================
   월간 그래프 & 리스트
========================= */
function drawWeight() {
  if (!elements.monthCtx) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  elements.monthTitle.innerText = `${year}년 ${month + 1}월`;
  elements.weightList.innerHTML = "";

  const monthWeights = records.filter((record) => {
    if (!record.date) return false;
    const recordDate = new Date(record.date);
    return recordDate.getFullYear() === year && recordDate.getMonth() === month && record.weight;
  });

  const weightValues = monthWeights.map((record) => Number(record.weight));
  
  const averageWeight = weightValues.length
    ? weightValues.reduce((sum, w) => sum + w, 0) / weightValues.length
    : 0;
  const maxWeight = weightValues.length ? Math.max(...weightValues) : 0;
  const minWeight = weightValues.length ? Math.min(...weightValues) : 0;

  const labels = [];
  const weights = [];
  let maxShown = false;
  let minShown = false;

  monthWeights.forEach((record) => {
    const recordDate = new Date(record.date);
    const dayOfWeek = WEEK_DAYS[recordDate.getDay()];
    const numWeight = Number(record.weight);

    labels.push([record.date.substring(8, 10), dayOfWeek]);
    weights.push(numWeight);

    let badgeText = "";
    if (numWeight === maxWeight && !maxShown) {
      badgeText = " (최고)";
      maxShown = true;
    } else if (numWeight === minWeight && !minShown) {
      badgeText = " (최저)";
      minShown = true;
    }

    const formattedDate = `${record.date.substring(5, 10)} (${dayOfWeek})`;

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="record-date">${formattedDate}</span>
      <span class="record-colon">:</span>
      <span class="record-value">${numWeight.toFixed(1)}kg</span>
      <span class="record-badge">${badgeText}</span>
    `;
    elements.weightList.appendChild(li);
  });

  // 기존 차트 확실하게 파괴
  if (chart) {
    chart.destroy();
    chart = null;
  }

  // 캔버스 엘리먼트 자체 초기화 방지
  const existingChart = Chart.getChart(elements.monthCtx);
  if (existingChart) existingChart.destroy();

  chart = new Chart(elements.monthCtx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "체중(kg)",
          data: weights,
          pointRadius: 5
        },
        {
          label: "평균 체중",
          data: weights.map(() => Number(averageWeight.toFixed(1))),
          borderDash: [5, 5],
          pointRadius: 0
        }
      ]
    },
    options: COMMON_CHART_OPTIONS,
    plugins: [averageLabelPlugin]
  });
}

/* =========================
   연간 그래프 & 리스트
========================= */
function drawYearlyWeight() {
  if (!elements.yearCtx) return;

  elements.yearTitle.innerText = `${currentYear}년`;
  elements.yearWeightList.innerHTML = "";

  const labels = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
  const monthlyAverages = [];

  for (let month = 0; month < 12; month++) {
    const monthWeights = records.filter((record) => {
      if (!record.weight || !record.date) return false;
      const recordDate = new Date(record.date);
      return recordDate.getFullYear() === currentYear && recordDate.getMonth() === month;
    });

    if (!monthWeights.length) {
      monthlyAverages.push(null);
      continue;
    }

    const total = monthWeights.reduce((sum, r) => sum + Number(r.weight), 0);
    const averageValue = Number((total / monthWeights.length).toFixed(1));
    monthlyAverages.push(averageValue);

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="record-date">${month + 1}월</span>
      <span class="record-colon">:</span>
      <span class="record-value">${averageValue.toFixed(1)}kg</span>
    `;
    elements.yearWeightList.appendChild(li);
  }

  // 기존 차트 확실하게 파괴
  if (yearChart) {
    yearChart.destroy();
    yearChart = null;
  }

  const existingChart = Chart.getChart(elements.yearCtx);
  if (existingChart) existingChart.destroy();

  yearChart = new Chart(elements.yearCtx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "월 평균 체중",
          data: monthlyAverages,
          pointRadius: 5,
          spanGaps: false
        }
      ]
    },
    options: COMMON_CHART_OPTIONS
  });
}

/* =========================
   전체 그래프 & 리스트
========================= */
function drawAllWeight() {
  if (!elements.allCtx) return;

  elements.allWeightList.innerHTML = "";

  const validRecords = records.filter((record) => record.weight && record.date);
  if (!validRecords.length) return;

  const dates = validRecords.map((r) => new Date(r.date)).sort((a, b) => a - b);

  const startYear = dates[0].getFullYear();
  const startMonth = dates[0].getMonth();
  const endYear = dates[dates.length - 1].getFullYear();
  const endMonth = dates[dates.length - 1].getMonth();

  const labels = [];
  const monthlyData = [];
  const monthlyRecords = [];

  let year = startYear;
  let month = startMonth;
  let currentYearTracker = null;

  while (year < endYear || (year === endYear && month <= endMonth)) {
    const monthRecords = validRecords.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate.getFullYear() === year && recordDate.getMonth() === month;
    });

    let average = null;
    if (monthRecords.length) {
      const total = monthRecords.reduce((sum, r) => sum + Number(r.weight), 0);
      average = Number((total / monthRecords.length).toFixed(1));
    }

    const monthStr = `${month + 1}월`;
    
    let yearStr = "";
    if (currentYearTracker !== year) {
      yearStr = `${String(year).slice(2)}년`;
      currentYearTracker = year;
    }

    labels.push([monthStr, yearStr]);
    monthlyData.push(average);
    monthlyRecords.push({ year, month, average });

    month++;
    if (month === 12) {
      month = 0;
      year++;
    }
  }

  let listYearTracker = null;

  monthlyRecords.forEach((item) => {
    if (item.average === null) return;

    if (listYearTracker !== item.year) {
      listYearTracker = item.year;
      const yearHeader = document.createElement("li");
      yearHeader.className = "record-year-header";
      yearHeader.innerText = `${item.year}년`;
      elements.allWeightList.appendChild(yearHeader);
    }

    const li = document.createElement("li");
    li.innerHTML = `
      <span class="record-date">${item.month + 1}월</span>
      <span class="record-colon">:</span>
      <span class="record-value">${item.average.toFixed(1)}kg</span>
    `;
    elements.allWeightList.appendChild(li);
  });

  // 기존 차트 확실하게 파괴
  if (allChart) {
    allChart.destroy();
    allChart = null;
  }

  const existingChart = Chart.getChart(elements.allCtx);
  if (existingChart) existingChart.destroy();

  allChart = new Chart(elements.allCtx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "월 평균 체중",
          data: monthlyData,
          pointRadius: 5,
          pointHoverRadius: 7,
          spanGaps: true,
          tension: 0.2
        }
      ]
    },
    options: {
      ...COMMON_CHART_OPTIONS,
      interaction: { mode: "index", intersect: false }
    }
  });
}

/* =========================
   UI 뷰 전환 공통 함수 (차트 리사이즈 보장)
========================= */
function switchView(activeType) {
  const views = {
    monthly: { view: elements.monthlyView, btn: elements.monthlyBtn, chart: () => chart },
    yearly: { view: elements.yearlyView, btn: elements.yearlyBtn, chart: () => yearChart },
    all: { view: elements.allView, btn: elements.allBtn, chart: () => allChart }
  };

  Object.keys(views).forEach((type) => {
    const isTarget = type === activeType;
    if (views[type].view) {
      views[type].view.style.display = isTarget ? "block" : "none";
    }
    if (views[type].btn) {
      views[type].btn.classList.toggle("active", isTarget);
    }
  });

  // display: block으로 바뀐 직후 차트 크기가 0px로 찌그러지는 현상을 방지하기 위해 렌더링 후 resize 호출
  setTimeout(() => {
    const targetChart = views[activeType].chart();
    if (targetChart) {
      targetChart.resize();
    }
  }, 50);
}

/* =========================
   이벤트 리스너 등록
========================= */
if (elements.monthlyBtn) {
  elements.monthlyBtn.addEventListener("click", () => {
    switchView("monthly");
    drawWeight();
  });
}

if (elements.yearlyBtn) {
  elements.yearlyBtn.addEventListener("click", () => {
    switchView("yearly");
    drawYearlyWeight();
  });
}

if (elements.allBtn) {
  elements.allBtn.addEventListener("click", () => {
    switchView("all");
    drawAllWeight();
  });
}

const prevMonthBtn = document.getElementById("prevMonth");
if (prevMonthBtn) {
  prevMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    drawWeight();
  });
}

const nextMonthBtn = document.getElementById("nextMonth");
if (nextMonthBtn) {
  nextMonthBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    drawWeight();
  });
}

const prevYearBtn = document.getElementById("prevYear");
if (prevYearBtn) {
  prevYearBtn.addEventListener("click", () => {
    currentYear--;
    drawYearlyWeight();
  });
}

const nextYearBtn = document.getElementById("nextYear");
if (nextYearBtn) {
  nextYearBtn.addEventListener("click", () => {
    currentYear++;
    drawYearlyWeight();
  });
}

// 실행
loadRecords();