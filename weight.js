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
    duration: 2000,
    from: NaN,
    delay(ctx) {
      if (ctx.type !== 'data' || ctx.xStarted) {
        return 0;
      }
      ctx.xStarted = true;
      return ctx.index * 120;
    }
  },
  y: {
    type: 'number',
    easing: 'easeOutQuart',
    duration: 1200
  }
};

/* =========================================================
   모바일 글씨 크기 고정용 공통 차트 옵션
   - maintainAspectRatio: true 로 설정하되,
   - font.size: 10 으로 모바일 폰트 크기를 강제 고정하고
   - maxRotation: 0 으로 글자가 회전하며 커지는 것을 방지합니다.
========================================================= */
const COMMON_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 1.8,
  animation: ANIMATION_CONFIG,
  layout: {
    padding: {
      left: 0,
      right: 20, // 우측 라벨/격자 공간 확보를 위한 깔끔한 20px
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
    if (!dataset || !dataset.data.length) return;

    const meta = chart.getDatasetMeta(1);
    const point = meta.data[meta.data.length - 1];
    if (!point) return;

    const value = dataset.data[dataset.data.length - 1];
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
  const snapshot = await getDocs(collection(db, "records"));
  
  records = [];
  snapshot.forEach((doc) => records.push(doc.data()));
  
  records.sort((a, b) => new Date(a.date) - new Date(b.date));

  drawWeight();
}

/* =========================
   월간 그래프 & 리스트
========================= */
function drawWeight() {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  elements.monthTitle.innerText = `${year}년 ${month + 1}월`;
  elements.weightList.innerHTML = "";

  const monthWeights = records.filter((record) => {
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

    let text = `${record.date.substring(5, 10)} (${dayOfWeek}) : ${numWeight.toFixed(1)}kg`;

    if (numWeight === maxWeight && !maxShown) {
      text += " (최고)";
      maxShown = true;
    }
    if (numWeight === minWeight && !minShown) {
      text += " (최저)";
      minShown = true;
    }

    const li = document.createElement("li");
    li.innerText = text;
    elements.weightList.appendChild(li);
  });

  if (chart) chart.destroy();

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
  elements.yearTitle.innerText = `${currentYear}년`;
  elements.yearWeightList.innerHTML = "";

  const labels = Array.from({ length: 12 }, (_, i) => `${i + 1}월`);
  const monthlyAverages = [];

  for (let month = 0; month < 12; month++) {
    const monthWeights = records.filter((record) => {
      if (!record.weight) return false;
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
    li.innerText = `${month + 1}월 : ${averageValue.toFixed(1)}kg`;
    elements.yearWeightList.appendChild(li);
  }

  if (yearChart) yearChart.destroy();

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

    const formattedLabel = `${String(year).slice(2)}.${String(month + 1).padStart(2, "0")}`;
    labels.push(formattedLabel);
    monthlyData.push(average);
    monthlyRecords.push({ year, month, average });

    month++;
    if (month === 12) {
      month = 0;
      year++;
    }
  }

  monthlyRecords.forEach((item) => {
    if (item.average === null) return;

    const li = document.createElement("li");
    const formattedDate = `${String(item.year).slice(2)}.${String(item.month + 1).padStart(2, "0")}`;
    li.innerText = `${formattedDate} : ${item.average}kg`;
    elements.allWeightList.appendChild(li);
  });

  if (allChart) allChart.destroy();

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

  interaction: {
    mode: "index",
    intersect: false
  },

  layout: {
    ...COMMON_CHART_OPTIONS.layout,
    padding: {
      ...COMMON_CHART_OPTIONS.layout.padding,
      right: 30
    }
  },

  scales: {
    ...COMMON_CHART_OPTIONS.scales,

    x: {
      ...COMMON_CHART_OPTIONS.scales.x
    }
  }
}
  });
}

/* =========================
   UI 뷰 전환 공통 함수
========================= */
function switchView(activeType) {
  const views = {
    monthly: { view: elements.monthlyView, btn: elements.monthlyBtn },
    yearly: { view: elements.yearlyView, btn: elements.yearlyBtn },
    all: { view: elements.allView, btn: elements.allBtn }
  };

  Object.keys(views).forEach((type) => {
    const isTarget = type === activeType;
    views[type].view.style.display = isTarget ? "block" : "none";
    views[type].btn.classList.toggle("active", isTarget);
  });
}

/* =========================
   이벤트 리스너 등록
========================= */
elements.monthlyBtn.addEventListener("click", () => switchView("monthly"));

elements.yearlyBtn.addEventListener("click", () => {
  switchView("yearly");
  drawYearlyWeight();
});

elements.allBtn.addEventListener("click", () => {
  switchView("all");
  drawAllWeight();
});

document.getElementById("prevMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  drawWeight();
});

document.getElementById("nextMonth").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  drawWeight();
});

document.getElementById("prevYear").addEventListener("click", () => {
  currentYear--;
  drawYearlyWeight();
});

document.getElementById("nextYear").addEventListener("click", () => {
  currentYear++;
  drawYearlyWeight();
});

// 실행
loadRecords();