// console.log("report.js 실행됨");

import { app } from "./firebase.js";

import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);

let records = [];

const monthTitle = document.getElementById("monthTitle");

let currentDate = new Date();

// 안전한 날짜 파싱 함수 (시차 방지)
function parseDate(dateStr) {
    if (!dateStr) return null;
    if (typeof dateStr === "object" && dateStr.toDate) {
        return dateStr.toDate();
    }
    const parts = String(dateStr).split("-");
    if (parts.length >= 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2].slice(0, 2)));
    }
    return new Date(dateStr);
}

async function loadRecords() {
    try {
        const snapshot = await getDocs(
            collection(db, "records")
        );

        records = [];

        snapshot.forEach(function (doc) {
            records.push(doc.data());
        });

        records.sort(function (a, b) {
            const dateA = parseDate(a.date);
            const dateB = parseDate(b.date);
            return (dateA || 0) - (dateB || 0);
        });

        drawReport();
    } catch (error) {
        console.error("데이터 로드 중 오류 발생:", error);
    }
}

function drawReport() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (monthTitle) {
        monthTitle.innerText = year + "년 " + (month + 1) + "월";
    }

    const runningLink = document.querySelector(".running-link");
    if (runningLink) {
        const monthValue = year + "-" + String(month + 1).padStart(2, "0");
        runningLink.href = "running.html?month=" + monthValue;
    }

    const weightLink = document.querySelector(".weight-link");
    if (weightLink) {
        const monthValue = year + "-" + String(month + 1).padStart(2, "0");
        weightLink.href = "weight.html?month=" + monthValue;
    }

    const monthRecords = records.filter(function (record) {
        const recordDate = parseDate(record.date);
        if (!recordDate) return false;
        return (
            recordDate.getFullYear() === year &&
            recordDate.getMonth() === month
        );
    });

    // ==========================================
    // 체중 리포트 및 스펙트럼 바 렌더링
    // ==========================================
    const weightRecords = monthRecords.filter(function (record) {
        return record.weight;
    });

    const weightSummaryEl = document.getElementById("weightSummary");

    if (weightSummaryEl) {
        if (weightRecords.length) {
            const first = Number(weightRecords[0].weight);
            const last = Number(weightRecords[weightRecords.length - 1].weight);
            const diff = (last - first).toFixed(1);

            // 변화량 텍스트 생성
            let changeText = first + "kg → " + last + "kg";
            if (diff > 0) {
                changeText += " (+" + diff + "kg)";
            } else if (diff < 0) {
                changeText += " (" + diff + "kg)";
            } else {
                changeText += " (변화 없음)";
            }

            // 평균 체중 계산
            const averageWeight = weightRecords.reduce(function (sum, record) {
                return sum + Number(record.weight);
            }, 0) / weightRecords.length;

            // 최고 / 최저 체중 계산 및 진폭 계산
            const maxWeight = Math.max(...weightRecords.map(r => Number(r.weight)));
            const minWeight = Math.min(...weightRecords.map(r => Number(r.weight)));
            const amplitude = (maxWeight - minWeight).toFixed(1);

            // 평균 위치 비율(%) 계산 (최저~최고 구간)
            let avgPercent = 50;
            if (maxWeight > minWeight) {
                avgPercent = ((averageWeight - minWeight) / (maxWeight - minWeight)) * 100;
            }

            // HTML 스펙트럼 바 레이아웃 생성
            const spectrumHtml = `
                <div class="weight-summary-header">
                    ${changeText}
                </div>
                
                <div class="spectrum-container">
                    <div class="spectrum-labels">
                        <span class="label-min">⬇ 최저 ${minWeight.toFixed(1)}kg</span>
                        <span class="label-max">⬆ 최고 ${maxWeight.toFixed(1)}kg</span>
                    </div>
                    
                    <div class="spectrum-bar-wrapper">
                        <div class="spectrum-bar"></div>
                        <div class="spectrum-pointer" style="left: ${avgPercent}%;">
                            <span class="pointer-tooltip">평균 ${averageWeight.toFixed(1)}kg</span>
                        </div>
                    </div>

                    <div class="spectrum-footer">
                        ↕️ 변동 진폭: <strong>${amplitude} kg</strong> (${minWeight.toFixed(1)} ~ ${maxWeight.toFixed(1)} kg)
                    </div>
                </div>
            `;

            weightSummaryEl.innerHTML = spectrumHtml;
        } else {
            weightSummaryEl.innerText = "기록 없음";
        }
    }

    // 운동 기록
    let runningTotal = 0;
    let runningCount = 0;
    let goalCount = 0;

    monthRecords.forEach(function (record) {
        if (record.running) {
            const time = Number(record.running);
            runningTotal += time;
            runningCount++;
            if (time >= 20) {
                goalCount++;
            }
        }
    });

    // 행동
    let good = 0;
    let normal = 0;
    let hard = 0;

    monthRecords.forEach(function (record) {
        if (record.behavior === "good") good++;
        if (record.behavior === "normal") normal++;
        if (record.behavior === "hard") hard++;
    });

    const goodCountEl = document.getElementById("goodCount");
    const normalCountEl = document.getElementById("normalCount");
    const hardCountEl = document.getElementById("hardCount");

    if (goodCountEl) goodCountEl.innerText = good;
    if (normalCountEl) normalCountEl.innerText = normal;
    if (hardCountEl) hardCountEl.innerText = hard;

    // ==========================================
    // 행동 달성률(%) 피드백 출력
    // ==========================================
    const totalDays = good + normal + hard;
    let feedbackMessage = "이번 달 활동 기록을 채워나가 보세요! 📝";

    if (totalDays > 0) {
        const goodRatio = Math.round((good / totalDays) * 100);

        if (goodRatio >= 80) {
            feedbackMessage = `🏆 Good 달성률 ${goodRatio}%! 완벽에 가까운 한 달이에요`;
        } else if (goodRatio >= 60) {
            feedbackMessage = `👏 Good 달성률 ${goodRatio}%! 아주 안정적이고 훌륭해요`;
        } else if (goodRatio >= 40) {
            feedbackMessage = `💪 Good 달성률 ${goodRatio}%! 조금만 더 초록빛을 늘려봐요`;
        } else {
            feedbackMessage = `🍀 Good 달성률 ${goodRatio}%! 다음 달은 더 성장해봐요`;
        }
    }

    const feedbackEl = document.getElementById("habitFeedback");
    if (feedbackEl) {
        feedbackEl.innerText = feedbackMessage;
    }

    // ==========================================
    // ===== 행동 미니 달력 (원본 로직 복원) =====
    // ==========================================
    const miniCalendar = document.getElementById("behaviorMiniCalendar");

    if (miniCalendar) {
        miniCalendar.innerHTML = "";

        // 요일 제목
        ["월", "화", "수", "목", "금"].forEach(function (day) {
            const header = document.createElement("div");
            header.className = "mini-header";
            header.innerText = day;
            miniCalendar.appendChild(header);
        });

        // 이번 달 첫날
        const firstDay = new Date(year, month, 1);

        // 월요일 기준 시작 위치
        let start = firstDay.getDay();
        if (start === 0) {
            start = 6;
        } else {
            start--;
        }

        // 첫 주 빈칸
        for (let i = 0; i < start; i++) {
            const empty = document.createElement("div");
            empty.className = "mini-empty";
            miniCalendar.appendChild(empty);
        }

        // 날짜 출력
        monthRecords.forEach(function (record) {
            const recordDate = parseDate(record.date);
            if (!recordDate) return;

            const day = recordDate.getDay();

            // 토,일은 표시 안함
            if (day === 0 || day === 6) {
                return;
            }

            const cell = document.createElement("div");
            cell.className = "mini-day";

            if (record.behavior === "good") {
                cell.classList.add("mini-good");
            } else if (record.behavior === "normal") {
                cell.classList.add("mini-normal");
            } else if (record.behavior === "hard") {
                cell.classList.add("mini-hard");
            }

            cell.title = record.date;
            miniCalendar.appendChild(cell);
        });
    }

    // ==========================================
    // 점심 TOP1 (공동 1위 처리 보완)
    // ==========================================
    const lunchMap = {};

    monthRecords.forEach(function (record) {
        if (!record.lunch) return;

        const lunchName = record.lunch.trim();
        if (!lunchName) return;

        if (!lunchMap[lunchName]) {
            lunchMap[lunchName] = 0;
        }
        lunchMap[lunchName]++;
    });

    let maxCount = 0;
    for (const lunch in lunchMap) {
        if (lunchMap[lunch] > maxCount) {
            maxCount = lunchMap[lunch];
        }
    }

    const topLunchEl = document.getElementById("topLunch");

    if (topLunchEl) {
        if (maxCount > 0) {
            const topLunches = [];
            for (const lunch in lunchMap) {
                if (lunchMap[lunch] === maxCount) {
                    topLunches.push(lunch);
                }
            }

            if (topLunches.length > 1) {
                topLunchEl.innerText = topLunches.join(", ") + " (각 " + maxCount + "회)";
            } else {
                topLunchEl.innerText = topLunches[0] + " (" + maxCount + "회)";
            }
        } else {
            topLunchEl.innerText = "기록 없음";
        }
    }
}

const prevBtn = document.getElementById("prevMonth");
if (prevBtn) {
    prevBtn.addEventListener("click", function () {
        currentDate.setMonth(currentDate.getMonth() - 1);
        drawReport();
    });
}

const nextBtn = document.getElementById("nextMonth");
if (nextBtn) {
    nextBtn.addEventListener("click", function () {
        currentDate.setMonth(currentDate.getMonth() + 1);
        drawReport();
    });
}

loadRecords();