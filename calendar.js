console.log("calendar.js 실행됨");

import { app } from "./firebase.js";
import {
    getFirestore,
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);

let records = [];

const calendar = document.getElementById("calendar");
const monthTitle = document.getElementById("monthTitle");

let currentDate = new Date();

// 데이터 로드
async function loadRecords() {
    try {
        const snapshot = await getDocs(collection(db, "records"));
        records = [];
        snapshot.forEach((doc) => {
            records.push(doc.data());
        });
        drawCalendar();
    } catch (error) {
        console.error("달력 데이터를 가져오는 중 오류 발생:", error);
    }
}

// 달력 그리기
function drawCalendar() {
    calendar.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    monthTitle.innerText = `${year}년 ${month + 1}월`;

    // 평일 요일 표시 (월~금)
    const days = ["월", "화", "수", "목", "금"];
    days.forEach((day) => {
        const div = document.createElement("div");
        div.className = "day-name";
        div.innerText = day;
        calendar.appendChild(div);
    });

    const lastDate = new Date(year, month + 1, 0).getDate();
    let count = 0;

    for (let i = 1; i <= lastDate; i++) {
        const dateObj = new Date(year, month, i);
        const week = dateObj.getDay();

        // 토요일(6), 일요일(0) 제외
        if (week === 0 || week === 6) {
            continue;
        }

        // 첫 주 빈칸 처리 (해당 월 1일의 요일 기준)
        if (count === 0) {
            const firstDayOfWeek = new Date(year, month, 1).getDay();
            const emptyCount = firstDayOfWeek === 0 ? 0 : firstDayOfWeek - 1; // 월요일(1) 기준 오프셋

            for (let j = 0; j < emptyCount; j++) {
                const empty = document.createElement("div");
                calendar.appendChild(empty);
                count++;
            }
        }

        const box = document.createElement("div");
        box.className = "calendar-day";

        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;

        const record = records.find((item) => item.date === dateStr);

        let behaviorEmoji = "";
        if (record) {
            if (record.behavior === "good") behaviorEmoji = " 🟢";
            else if (record.behavior === "normal") behaviorEmoji = " 🟡";
            else if (record.behavior === "hard") behaviorEmoji = " 🔴";
        }

        let html = `<strong>${i}${behaviorEmoji}</strong>`;

        if (record) {
            if (record.holiday || record.behavior === "holiday") {
                html += `<div class='holiday-text'>🚫 휴강</div>`;
                box.classList.add("holiday");
            } else {
                html += `<div class='record-line'>🕘 ${record.morning || ""}</div>`;
                html += `<div class='record-line'>🍚 ${record.lunch || ""}</div>`;
                html += `<div class='record-line'>⛅ ${record.afternoon || ""}</div>`;
                html += `<div class='record-line'>🏃 ${record.running ? record.running + "분" : ""}</div>`;
                html += `<div class='record-line'>⚖️ ${record.weight ? Number(record.weight).toFixed(1) + "kg" : ""}</div>`;
            }
        } else {
            // 빈 레코드 라인 생성
            html += `<div class='record-line'></div>`.repeat(5);
        }

        box.innerHTML = html;
        calendar.appendChild(box);
        count++;
    }
}

// 이전달 이동 (날짜 이탈 방지 처리)
document.getElementById("prevMonth").addEventListener("click", () => {
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() - 1);
    drawCalendar();
});

// 다음달 이동 (날짜 이탈 방지 처리)
document.getElementById("nextMonth").addEventListener("click", () => {
    currentDate.setDate(1);
    currentDate.setMonth(currentDate.getMonth() + 1);
    drawCalendar();
});

loadRecords();