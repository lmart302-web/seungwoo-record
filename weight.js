import { app } from "./firebase.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);

// 상태 변수
let records = [];
let chart = null;
let allChart = null;

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 날짜 안전 파싱 (시차 및 문자열 파싱 보완)
function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("-");
  if (parts.length < 3) return new Date(dateStr);
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

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
const isMobile = window.innerWidth <= 600;

const COMMON_CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: isMobile ? 1.1 : 1.8,
  animation: ANIMATION_CONFIG,

  plugins: {
    legend: {
      position: 'top',
      align: 'end'
    }
  },

  layout: {
    padding: {
      left: isMobile ? 4 : 0,
      right: isMobile ? 2 : 15,
      top: 10,
      bottom: 0
    }
  },

  scales: {
    x: {
      offset: false,
      grid: {
        drawBorder: false
      },
      ticks: {
        font: {
          size: 10
        },
        maxRotation: 0,
        autoSkip: true
      }
    },

    y: {
      beginAtZero: false,
      grace: '10%',
      ticks: {
        font: {
          size: 10
        }
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

  allCtx: document.getElementById("allWeightChart"),
  allWeightList: document.getElementById("allWeightList"),
  allView: document.getElementById("allView"),
  allBtn: document.getElementById("allBtn")
};

// 현재 날짜 상태
const params = new URLSearchParams(location.search);
const monthParam = params.get("month");

let currentDate = monthParam
  ? parseDate(`${monthParam}-01`)
  : new Date();

let currentYear = currentDate.getFullYear();

/* =========================
   Chart.js 플러그인
========================= */
const averageLabelPlugin = {
  id: "averageLabel",

  afterDatasetsDraw(chart) {
    const dataset = chart.data.datasets[1];

    if (!dataset || !dataset.data || !dataset.data.length) {
      return;
    }

    const meta = chart.getDatasetMeta(1);

    if (!meta.data || !meta.data.length) {
      return;
    }

    const point = meta.data[meta.data.length - 1];

    if (!point) {
      return;
    }

    const value = dataset.data[dataset.data.length - 1];

    if (value === null || value === undefined) {
      return;
    }

    const { ctx, chartArea } = chart;

    ctx.save();

    ctx.font = "12px sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.fillText(
      `평균 ${Number(value).toFixed(1)}`,
      chartArea.left + 5,
      point.y
    );

    ctx.restore();
  }
};

/* =========================
   데이터 로드
========================= */
async function loadRecords() {
  try {
    const q = query(
      collection(db, "records"),
      orderBy("date", "asc")
    );

    const snapshot = await getDocs(q);

    records = [];

    snapshot.forEach((doc) => {
      records.push(doc.data());
    });

    drawWeight();

  } catch (error) {
    console.error("데이터를 가져오는 중 오류 발생:", error);
  }
}

/* =========================================================
   월간 그래프 & 리스트
========================================================= */
function drawWeight() {
  if (!elements.monthCtx) return;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  if (elements.monthTitle) {
    elements.monthTitle.innerText = `${year}년 ${month + 1}월`;
  }

  if (elements.weightList) {
    elements.weightList.innerHTML = "";
  }

  const monthWeights = records.filter((record) => {
    if (!record.date) return false;

    const recordDate = parseDate(record.date);

    return (
      recordDate.getFullYear() === year &&
      recordDate.getMonth() === month &&
      record.weight
    );
  });

  const weightValues = monthWeights.map((record) =>
    Number(record.weight)
  );

  const averageWeight = weightValues.length
    ? weightValues.reduce((sum, w) => sum + w, 0) / weightValues.length
    : 0;

  const maxWeight = weightValues.length
    ? Math.max(...weightValues)
    : null;

  const minWeight = weightValues.length
    ? Math.min(...weightValues)
    : null;

  const labels = [];
  const weights = [];

  let maxShown = false;
  let minShown = false;

  monthWeights.forEach((record) => {
    const recordDate = parseDate(record.date);
    const dayOfWeek = WEEK_DAYS[recordDate.getDay()];
    const numWeight = Number(record.weight);

    labels.push([
      record.date.substring(8, 10),
      dayOfWeek
    ]);

    weights.push(numWeight);

    let badgeText = "";
    let badgeColor = "";

    if (
      maxWeight !== null &&
      numWeight === maxWeight &&
      !maxShown
    ) {
      badgeText = " (최고)";
      badgeColor = "#ff4d4f";
      maxShown = true;

    } else if (
      minWeight !== null &&
      numWeight === minWeight &&
      !minShown
    ) {
      badgeText = " (최저)";
      badgeColor = "#0052CC";
      minShown = true;
    }

    const formattedDate =
      `${record.date.substring(5, 10)} (${dayOfWeek})`;

    if (elements.weightList) {
      const li = document.createElement("li");

      li.innerHTML = `
        <span class="record-date" style="color: #666666;">
          ${formattedDate}
        </span>

        <span class="record-colon">:</span>

        <span
          class="record-value"
          style="color: #222222; font-weight: 600;"
        >
          ${numWeight.toFixed(1)}kg
        </span>

        <span
          class="record-badge"
          style="
            font-weight: bold;
            color: ${badgeColor};
            margin-left: 4px;
          "
        >
          ${badgeText}
        </span>
      `;

      elements.weightList.appendChild(li);
    }
  });

  // 월간 차트 최고/최저 점 색상 및 크기 지정
  const pointBgColors = weights.map((w) => {
    if (maxWeight !== null && w === maxWeight) {
      return "#ff4d4f";
    }

    if (minWeight !== null && w === minWeight) {
      return "#0052CC";
    }

    return "#36A2EB";
  });

  const pointRadii = weights.map((w) => {
    if (
      (maxWeight !== null && w === maxWeight) ||
      (minWeight !== null && w === minWeight)
    ) {
      return 6;
    }

    return 4;
  });

  if (chart) {
    chart.destroy();
  }

  const existingChart = Chart.getChart(elements.monthCtx);

  if (existingChart) {
    existingChart.destroy();
  }

  chart = new Chart(elements.monthCtx, {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: "체중(kg)",
          data: weights,

          pointRadius: pointRadii,
          pointBackgroundColor: pointBgColors,
          pointBorderColor: pointBgColors
        },

        {
          label: "평균 체중",
          data: weights.map(() =>
            Number(averageWeight.toFixed(1))
          ),

          borderDash: [5, 5],
          pointRadius: 0
        }
      ]
    },

    options: {
      ...COMMON_CHART_OPTIONS,

      plugins: {
        ...COMMON_CHART_OPTIONS.plugins,

        tooltip: {
          displayColors: false,

          callbacks: {
            title: () => "",

            label: (context) => {
              const label =
                context.chart.data.labels[context.dataIndex];

              const date = Array.isArray(label)
                ? `${label[0]}(${label[1]})`
                : label;

              return `${date} : ${context.parsed.y} kg`;
            }
          }
        }
      }
    },

    plugins: [
      averageLabelPlugin
    ]
  });
}

/* =========================================================
   전체 그래프 & 리스트
========================================================= */
function drawAllWeight() {
  if (!elements.allCtx) return;

  if (elements.allWeightList) {
    elements.allWeightList.innerHTML = "";
  }

  const validRecords = records.filter(
    (record) => record.weight && record.date
  );

  if (!validRecords.length) return;

  const dates = validRecords
    .map((r) => parseDate(r.date))
    .sort((a, b) => a - b);

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

  while (
    year < endYear ||
    (year === endYear && month <= endMonth)
  ) {
    const monthRecords = validRecords.filter((record) => {
      const recordDate = parseDate(record.date);

      return (
        recordDate.getFullYear() === year &&
        recordDate.getMonth() === month
      );
    });

    let average = null;

    if (monthRecords.length) {
      const total = monthRecords.reduce(
        (sum, r) => sum + Number(r.weight),
        0
      );

      average = Number(
        (total / monthRecords.length).toFixed(1)
      );
    }

    const monthStr = `${month + 1}월`;

    let yearStr = "";

    if (currentYearTracker !== year) {
      yearStr = `${String(year).slice(2)}년`;
      currentYearTracker = year;
    }

    labels.push([
      monthStr,
      yearStr
    ]);

    monthlyData.push(average);

    monthlyRecords.push({
      year,
      month,
      average
    });

    month++;

    if (month === 12) {
      month = 0;
      year++;
    }
  }

  const validMonthlyAverages = monthlyRecords
    .map((item) => item.average)
    .filter((avg) => avg !== null);

  const maxAvg = validMonthlyAverages.length
    ? Math.max(...validMonthlyAverages)
    : null;

  const minAvg = validMonthlyAverages.length
    ? Math.min(...validMonthlyAverages)
    : null;

  let maxShown = false;
  let minShown = false;

  let listYearTracker = null;

  monthlyRecords.forEach((item) => {
    if (item.average === null) return;

    if (elements.allWeightList) {

      if (listYearTracker !== item.year) {
        listYearTracker = item.year;

        const yearHeader =
          document.createElement("li");

        yearHeader.className =
          "record-year-header";

        yearHeader.innerText =
          `${item.year}년`;

        elements.allWeightList.appendChild(
          yearHeader
        );
      }

      let badgeText = "";
      let badgeColor = "";

      if (
        maxAvg !== null &&
        item.average === maxAvg &&
        !maxShown
      ) {
        badgeText = " (최고)";
        badgeColor = "#ff4d4f";
        maxShown = true;

      } else if (
        minAvg !== null &&
        item.average === minAvg &&
        !minShown
      ) {
        badgeText = " (최저)";
        badgeColor = "#0052CC";
        minShown = true;
      }

      const li = document.createElement("li");

      li.innerHTML = `
        <span class="record-date">
          ${item.month + 1}월
        </span>

        <span class="record-colon">:</span>

        <span class="record-value">
          ${item.average.toFixed(1)}kg
        </span>

        <span
          class="record-badge"
          style="
            font-weight: bold;
            color: ${badgeColor};
            margin-left: 4px;
          "
        >
          ${badgeText}
        </span>
      `;

      elements.allWeightList.appendChild(li);
    }
  });

  // 전체 차트 최고/최저 점 색상 및 크기 지정
  const pointBgColors = monthlyData.map((val) => {

    if (val === null) {
      return "#36A2EB";
    }

    if (
      maxAvg !== null &&
      val === maxAvg
    ) {
      return "#ff4d4f";
    }

    if (
      minAvg !== null &&
      val === minAvg
    ) {
      return "#0052CC";
    }

    return "#36A2EB";
  });

  const pointRadii = monthlyData.map((val) => {

    if (
      val !== null &&
      (
        (maxAvg !== null && val === maxAvg) ||
        (minAvg !== null && val === minAvg)
      )
    ) {
      return 6;
    }

    return 4;
  });

  if (allChart) {
    allChart.destroy();
  }

  const existingChart =
    Chart.getChart(elements.allCtx);

  if (existingChart) {
    existingChart.destroy();
  }

  allChart = new Chart(elements.allCtx, {
    type: "line",

    data: {
      labels,

      datasets: [
        {
          label: "월 평균 체중(kg)",
          data: monthlyData,

          pointRadius: pointRadii,
          pointHoverRadius: 7,

          pointBackgroundColor:
            pointBgColors,

          pointBorderColor:
            pointBgColors,

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

      plugins: {
        ...COMMON_CHART_OPTIONS.plugins,

        tooltip: {
          displayColors: false,

          callbacks: {
            title: () => "",

            label: (context) => {
              const label =
                context.chart.data.labels[
                  context.dataIndex
                ];

              if (Array.isArray(label)) {
                return `${label[0]} : ${context.parsed.y} kg`;
              }

              return `${label} : ${context.parsed.y} kg`;
            }
          }
        }
      }
    }
  });
}

/* =========================================================
   UI 뷰 전환 공통 함수
========================================================= */
function playWeightNeon(
  activeType = "monthly"
) {
  const section = document.querySelector(
    `#${activeType}View .weight-chart-section`
  );

  if (!section) return;

  section.classList.remove(
    "neon-active"
  );

  // 애니메이션 재실행
  void section.offsetWidth;

  section.classList.add(
    "neon-active"
  );

  setTimeout(() => {
    section.classList.remove(
      "neon-active"
    );
  }, 2000);
}

function switchView(activeType) {

  const views = {
    monthly: {
      view: elements.monthlyView,
      btn: elements.monthlyBtn,
      draw: drawWeight,
      getChart: () => chart
    },

    all: {
      view: elements.allView,
      btn: elements.allBtn,
      draw: drawAllWeight,
      getChart: () => allChart
    }
  };

  Object.keys(views).forEach(
    (type) => {

      const isTarget =
        type === activeType;

      if (views[type].view) {
        views[type].view.style.display =
          isTarget ? "block" : "none";
      }

      if (views[type].btn) {
        views[type].btn.classList.toggle(
          "active",
          isTarget
        );
      }
    }
  );

  views[activeType].draw();

  playWeightNeon(activeType);

  requestAnimationFrame(() => {

    setTimeout(() => {

      const activeChart =
        views[activeType].getChart();

      if (activeChart) {
        activeChart.resize();
      }

    }, 50);
  });
}

/* =========================================================
   이벤트 리스너 등록
========================================================= */
if (elements.monthlyBtn) {

  elements.monthlyBtn.addEventListener(
    "click",
    () => switchView("monthly")
  );
}

if (elements.allBtn) {

  elements.allBtn.addEventListener(
    "click",
    () => switchView("all")
  );
}

const prevMonthBtn =
  document.getElementById("prevMonth");

if (prevMonthBtn) {

  prevMonthBtn.addEventListener(
    "click",
    () => {

      currentDate.setDate(1);

      currentDate.setMonth(
        currentDate.getMonth() - 1
      );

      drawWeight();

      playWeightNeon("monthly");
    }
  );
}

const nextMonthBtn =
  document.getElementById("nextMonth");

if (nextMonthBtn) {

  nextMonthBtn.addEventListener(
    "click",
    () => {

      currentDate.setDate(1);

      currentDate.setMonth(
        currentDate.getMonth() + 1
      );

      drawWeight();

      playWeightNeon("monthly");
    }
  );
}

/* =========================================================
   초기 로드 실행
========================================================= */
loadRecords();

playWeightNeon("monthly");