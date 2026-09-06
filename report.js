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
    
    // Firestore Timestamp 객체인 경우
    if (typeof dateStr === "object" && typeof dateStr.toDate === "function") {
        return dateStr.toDate();
    }

    // "YYYY-MM-DD" 또는 "YYYY-MM-DDTHH:mm:ss" 형태의 문자열 파싱
    if (typeof dateStr === "string") {
        const cleanStr = dateStr.split("T")[0]; // 시간 정보 제외
        const parts = cleanStr.split("-");
        if (parts.length >= 3) {
            return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        }
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
        const weightSection = weightSummaryEl.closest(".section");

        if (weightRecords.length) {
            const first = Number(weightRecords[0].weight);
            const last = Number(weightRecords[weightRecords.length - 1].weight);
            const diff = (last - first).toFixed(1);

            let changeText = first + "kg → " + last + "kg";
            if (diff > 0) {
                changeText += " (+" + diff + "kg)";
            } else if (diff < 0) {
                changeText += " (" + diff + "kg)";
            } else {
                changeText += " (변화 없음)";
            }

            const averageWeight = weightRecords.reduce(function (sum, record) {
                return sum + Number(record.weight);
            }, 0) / weightRecords.length;

            const maxWeight = Math.max(...weightRecords.map(r => Number(r.weight)));
            const minWeight = Math.min(...weightRecords.map(r => Number(r.weight)));
            const amplitude = (maxWeight - minWeight).toFixed(1);

            let avgPercent = 50;
            if (maxWeight > minWeight) {
                avgPercent = ((averageWeight - minWeight) / (maxWeight - minWeight)) * 100;
            }

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
            weightSummaryEl.style.margin = ""; 

            // [기록 있음] 체중 카드 하단 여백 최대로 줄임 (6px)
            if (weightSection) weightSection.style.paddingBottom = "2px";
        } else {
            weightSummaryEl.innerText = "기록 없음";
            weightSummaryEl.style.marginTop = "16px";
            weightSummaryEl.style.marginBottom = "0px";

            // [기록 없음] 체중 카드 기본 여백 복원
            if (weightSection) weightSection.style.paddingBottom = "20px";
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
    // ===== 행동 영역 (간격 및 하단 여백 최적화) =====
    // ==========================================
    const miniCalendar = document.getElementById("behaviorMiniCalendar");
    const behaviorSummaryEl = document.querySelector(".behavior-summary");
    const behaviorSection = miniCalendar ? miniCalendar.closest(".section") : null;

    const hasBehaviorData = monthRecords.some(function (r) {
        return r.behavior;
    });

    if (!hasBehaviorData) {
        if (behaviorSummaryEl) {
            behaviorSummaryEl.style.display = "none";
        }

        if (miniCalendar) {
            miniCalendar.innerHTML = "";
            miniCalendar.style.display = "block";
            
            miniCalendar.style.marginTop = "16px";
            miniCalendar.style.marginBottom = "0px";
            miniCalendar.style.padding = "0px";
            miniCalendar.style.minHeight = "0px";

            const noDataEl = document.createElement("div");
            noDataEl.innerText = "기록 없음";
            noDataEl.style.margin = "0";
            noDataEl.style.padding = "0";
            noDataEl.style.lineHeight = "1";
            
            miniCalendar.appendChild(noDataEl);
        }

        // [기록 없음] 행동통계 카드 기본 여백 복원
        if (behaviorSection) behaviorSection.style.paddingBottom = "20px";

    } else {
        if (behaviorSummaryEl) {
            behaviorSummaryEl.style.display = "block";
        }

        // [기록 있음] 행동통계 카드 하단 여백 최대로 줄임 (6px)
        if (behaviorSection) behaviorSection.style.paddingBottom = "0px";

        let good = 0, normal = 0, hard = 0;
        monthRecords.forEach(function (r) {
            if (r.behavior === "good") good++;
            if (r.behavior === "normal") normal++;
            if (r.behavior === "hard") hard++;
        });

        const goodCountEl = document.getElementById("goodCount");
        const normalCountEl = document.getElementById("normalCount");
        const hardCountEl = document.getElementById("hardCount");

        if (goodCountEl) goodCountEl.innerText = good;
        if (normalCountEl) normalCountEl.innerText = normal;
        if (hardCountEl) hardCountEl.innerText = hard;

        if (miniCalendar) {
            miniCalendar.innerHTML = "";
            
            miniCalendar.style.display = "grid";
            miniCalendar.style.textAlign = "initial";
            miniCalendar.style.marginTop = "";
            miniCalendar.style.marginBottom = "";

            ["월", "화", "수", "목", "금"].forEach(function (day) {
                const header = document.createElement("div");
                header.className = "mini-header";
                header.innerText = day;
                miniCalendar.appendChild(header);
            });

            const lastDayNum = new Date(year, month + 1, 0).getDate();

            const recordMap = {};
            monthRecords.forEach(function (r) {
                const rd = parseDate(r.date);
                if (rd) recordMap[rd.getDate()] = r;
            });

            const firstDayObj = new Date(year, month, 1);
            const startDayOfWeek = firstDayObj.getDay();

            let offset = 0;
            if (startDayOfWeek !== 0 && startDayOfWeek !== 6) {
                offset = startDayOfWeek - 1;
            }

            for (let i = 0; i < offset; i++) {
                const empty = document.createElement("div");
                empty.style.visibility = "hidden";
                miniCalendar.appendChild(empty);
            }

            for (let dayNum = 1; dayNum <= lastDayNum; dayNum++) {
                const dateObj = new Date(year, month, dayNum);
                const dayOfWeek = dateObj.getDay();

                if (dayOfWeek === 0 || dayOfWeek === 6) continue;

                const record = recordMap[dayNum];

                if (record && record.behavior) {
                    const cell = document.createElement("div");
                    cell.className = "mini-day";

                    if (record.behavior === "good") cell.classList.add("mini-good");
                    else if (record.behavior === "normal") cell.classList.add("mini-normal");
                    else if (record.behavior === "hard") cell.classList.add("mini-hard");

                    cell.title = record.date;
                    miniCalendar.appendChild(cell);
                } else {
                    const emptyCell = document.createElement("div");
                    emptyCell.style.visibility = "hidden";
                    miniCalendar.appendChild(emptyCell);
                }
            }
        }
    }

    // ==========================================
    // 점심 TOP1
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
        const lunchSection = topLunchEl.closest(".section");

        topLunchEl.style.cssText = "";

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

            topLunchEl.classList.add("top-lunch-box");
            if (lunchSection) lunchSection.style.paddingBottom = "24px";
        } else {
            topLunchEl.innerText = "기록 없음";

            topLunchEl.classList.remove("top-lunch-box");
            topLunchEl.style.marginTop = "16px";
            topLunchEl.style.color = "#6c757d";
            if (lunchSection) lunchSection.style.paddingBottom = "20px";
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