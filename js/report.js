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


// ==========================================
// 안전한 날짜 파싱
// ==========================================

function parseDate(dateStr) {
    if (!dateStr) return null;

    // Firestore Timestamp
    if (
        typeof dateStr === "object" &&
        typeof dateStr.toDate === "function"
    ) {
        return dateStr.toDate();
    }

    // YYYY-MM-DD 또는 YYYY-MM-DDTHH:mm:ss
    if (typeof dateStr === "string") {
        const cleanStr = dateStr.split("T")[0];
        const parts = cleanStr.split("-");

        if (parts.length >= 3) {
            return new Date(
                Number(parts[0]),
                Number(parts[1]) - 1,
                Number(parts[2])
            );
        }
    }

    return new Date(dateStr);
}


// ==========================================
// Firebase 기록 불러오기
// ==========================================

async function loadRecords() {
    try {
        const snapshot = await getDocs(
            collection(db, "records")
        );

        records = [];

        snapshot.forEach(function (doc) {
            records.push(doc.data());
        });

        // 날짜순 정렬
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


// ==========================================
// 월간 리포트
// ==========================================

function drawReport() {

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();


    // ==========================================
    // 월 제목
    // ==========================================

    if (monthTitle) {
        monthTitle.innerText =
            year + "년 " + (month + 1) + "월";
    }


    // ==========================================
    // 운동 기록 페이지 링크
    // ==========================================

    const runningLink = document.querySelector(".running-link");

    if (runningLink) {
        const monthValue =
            year + "-" + String(month + 1).padStart(2, "0");

        runningLink.href =
            "running.html?month=" + monthValue;
    }


    // ==========================================
    // 체중 기록 페이지 링크
    // ==========================================

    const weightLink = document.querySelector(".weight-link");

    if (weightLink) {
        const monthValue =
            year + "-" + String(month + 1).padStart(2, "0");

        weightLink.href =
            "weight.html?month=" + monthValue;
    }


    // ==========================================
    // 해당 월 기록만 추출
    // ==========================================

    const monthRecords = records.filter(function (record) {

        const recordDate = parseDate(record.date);

        if (!recordDate) return false;

        return (
            recordDate.getFullYear() === year &&
            recordDate.getMonth() === month
        );
    });


    // ==========================================
    // 월 종료 여부
    // ==========================================

    const today = new Date();

    const isMonthFinished =
        year < today.getFullYear() ||
        (
            year === today.getFullYear() &&
            month < today.getMonth()
        );

    const currentLabel =
        isMonthFinished ? "종료" : "현재";


    // ==========================================
    // 체중 리포트
    // ==========================================

    const weightRecords = monthRecords.filter(function (record) {
        return record.weight;
    });

    const weightSummaryEl =
        document.getElementById("weightSummary");


    if (weightSummaryEl) {

        const weightSection =
            weightSummaryEl.closest(".section");


        if (weightRecords.length) {

            const first =
                Number(weightRecords[0].weight);

            const last =
                Number(
                    weightRecords[weightRecords.length - 1].weight
                );


            // 평균
            const averageWeight =
                weightRecords.reduce(function (sum, record) {
                    return sum + Number(record.weight);
                }, 0) / weightRecords.length;


            // 최고 / 최저
            const maxWeight =
                Math.max(
                    ...weightRecords.map(function (r) {
                        return Number(r.weight);
                    })
                );

            const minWeight =
                Math.min(
                    ...weightRecords.map(function (r) {
                        return Number(r.weight);
                    })
                );


            // 진폭
            const amplitude =
                (maxWeight - minWeight).toFixed(1);


            // ------------------------------------------
            // 체중값 → 세로 위치
            // 0% = 최고
            // 100% = 최저
            // ------------------------------------------

            function getVerticalPercent(weight) {

                if (maxWeight === minWeight) {
                    return 50;
                }

                return (
                    (maxWeight - weight) /
                    (maxWeight - minWeight)
                ) * 100;
            }


            const firstPercent =
                getVerticalPercent(first);

            const lastPercent =
                getVerticalPercent(last);


            // ------------------------------------------
            // 시작 / 현재 라벨 간격
            // ------------------------------------------

            const minLabelGap = 75;

            let startLabelOffset = -10.25;
            let currentLabelOffset = 7.25;


            const pixelGap =
                Math.abs(firstPercent - lastPercent) *
                270 / 100;


            if (pixelGap < minLabelGap) {

                const push =
                    Math.min(
                        (minLabelGap - pixelGap) / 2,
                        12
                    );


                if (firstPercent < lastPercent) {

                    startLabelOffset = -push;
                    currentLabelOffset = push;

                } else {

                    startLabelOffset = push;
                    currentLabelOffset = -push;
                }
            }


            // 평균 위치
            const averageDisplayWeight =
                Number(averageWeight.toFixed(1));

            const avgPercent =
                getVerticalPercent(averageDisplayWeight);


            // ------------------------------------------
            // 시작 → 현재 변화량
            // ------------------------------------------

            const diff =
                (last - first).toFixed(1);


            let diffText = "변화 없음";
            let diffClass = "weight-same";


            if (Number(diff) > 0) {

                diffText = "+" + diff;
                diffClass = "weight-up";

            } else if (Number(diff) < 0) {

                diffText = diff;
                diffClass = "weight-down";
            }


            // ------------------------------------------
            // 시작 → 현재 연결선
            // ------------------------------------------

            const startCurrentTop =
                Math.min(
                    firstPercent,
                    lastPercent
                );


            const startCurrentHeight =
                Math.abs(
                    firstPercent - lastPercent
                );


            const arrowDirection =
                lastPercent > firstPercent
                    ? "arrow-down"
                    : lastPercent < firstPercent
                        ? "arrow-up"
                        : "";


            const journeyPixelGap =
                startCurrentHeight * 270 / 100;


            const hideJourneyArrow =
                journeyPixelGap < 25;


            // ------------------------------------------
            // 세로 스펙트럼 HTML
            // ------------------------------------------

            const spectrumHtml = `

                <div class="vertical-weight-spectrum">

                    <div class="vertical-spectrum-area">

                        <div class="spectrum-vertical">

                            <!-- 스펙트럼 -->
                            <div class="spectrum-bar"></div>


                            <!-- 현재 위치까지 채우기 -->
                            <div
                                class="spectrum-current-fill"
                                style="
                                    top: 0;
                                    height: ${lastPercent}%;
                                "
                            ></div>


                            <!-- 최고 -->
                            <div
                                class="spectrum-point spectrum-max"
                                style="top: 0%;"
                            >
                                <div class="point-dot"></div>

                                <div class="spectrum-side-label">
                                    <strong>최고</strong>
                                    <span>
                                        ${maxWeight.toFixed(1)}
                                    </span>
                                </div>
                            </div>


                            <!-- 평균 -->
                            <div
                                class="spectrum-point spectrum-average"
                                style="top: ${avgPercent}%"
                            >
                                <div class="point-dot"></div>

                                <div class="spectrum-average-label">
                                    평균
                                    <strong>
                                        ${averageDisplayWeight.toFixed(1)}
                                    </strong>
                                </div>
                            </div>


                            <!-- 최저 -->
                            <div
                                class="spectrum-point spectrum-min"
                                style="top: 100%;"
                            >
                                <div class="point-dot"></div>

                                <div class="spectrum-side-label">
                                    <strong>최저</strong>
                                    <span>
                                        ${minWeight.toFixed(1)}
                                    </span>
                                </div>
                            </div>


                            <!-- 진폭 -->
                            <div class="spectrum-amplitude">

                                <div class="amplitude-line"></div>

                                <div class="amplitude-arrow arrow-top">
                                    ▲
                                </div>

                                <div class="amplitude-arrow arrow-bottom">
                                    ▼
                                </div>

                                <div class="amplitude-label">
                                    <span>진폭</span>
                                    <strong>${amplitude}</strong>
                                </div>

                            </div>


                            <!-- 시작 → 현재 연결선 -->
                            <div
                                class="weight-journey-vertical
                                ${arrowDirection}
                                ${hideJourneyArrow ? "hide-arrow" : ""}"
                                style="
                                    top: calc(${startCurrentTop}% + 7px);
                                    height: calc(${startCurrentHeight}% - 14px);
                                "
                            ></div>


                            <!-- 시작 -->
                            <div
                                class="journey-point journey-start"
                                style="top: ${firstPercent}%"
                            >

                                <div class="journey-dot"></div>

                                <div
                                    class="journey-label"
                                    style="
                                        transform:
                                        translateY(
                                            calc(
                                                -50% +
                                                ${startLabelOffset}px
                                            )
                                        );
                                    "
                                >
                                    <strong>
                                        ${first.toFixed(1)}
                                    </strong>

                                    <span>(시작)</span>
                                </div>

                            </div>


                            <!-- 현재 -->
                            <div
                                class="journey-point journey-current"
                                style="top: ${lastPercent}%"
                            >

                                <div class="journey-dot"></div>

                                <div
                                    class="journey-label"
                                    style="
                                        transform:
                                        translateY(
                                            calc(
                                                -50% +
                                                ${currentLabelOffset}px
                                            )
                                        );
                                    "
                                >
                                    <strong>
                                        ${last.toFixed(1)}
                                    </strong>

                                    <span>
                                        (${currentLabel})
                                    </span>
                                </div>

                            </div>


                            <!-- 변화량 -->
                            <div
                                class="journey-diff ${diffClass}"
                                style="
                                    top:
                                    ${(firstPercent + lastPercent) / 2}%;
                                "
                            >
                                ${diffText}
                            </div>

                        </div>

                    </div>

                </div>
            `;


            weightSummaryEl.innerHTML =
                spectrumHtml;

            weightSummaryEl.style.margin = "";


            if (weightSection) {
                weightSection.style.paddingBottom =
                    "1.3px";
            }


        } else {

            // 체중 기록 없음
            weightSummaryEl.innerText =
                "기록 없음";

            weightSummaryEl.style.marginTop =
                "16px";

            weightSummaryEl.style.marginBottom =
                "0px";


            if (weightSection) {
                weightSection.style.paddingBottom =
                    "20px";
            }
        }
    }


    // ==========================================
    // 행동 기록
    // ==========================================

    const miniCalendar =
        document.getElementById(
            "behaviorMiniCalendar"
        );

    const behaviorSummaryEl =
        document.querySelector(
            ".behavior-summary"
        );

    const behaviorSection =
        miniCalendar
            ? miniCalendar.closest(".section")
            : null;


    const hasBehaviorData =
        monthRecords.some(function (record) {
            return record.behavior;
        });


    // ------------------------------------------
    // 행동 통계 계산
    // ------------------------------------------

    let good = 0;
    let normal = 0;
    let hard = 0;


    monthRecords.forEach(function (record) {

        if (record.behavior === "good") {
            good++;
        }

        if (record.behavior === "normal") {
            normal++;
        }

        if (record.behavior === "hard") {
            hard++;
        }
    });


    const goodCountEl =
        document.getElementById("goodCount");

    const normalCountEl =
        document.getElementById("normalCount");

    const hardCountEl =
        document.getElementById("hardCount");


    if (goodCountEl) {
        goodCountEl.innerText = good;
    }

    if (normalCountEl) {
        normalCountEl.innerText = normal;
    }

    if (hardCountEl) {
        hardCountEl.innerText = hard;
    }


    // ------------------------------------------
    // 행동 기록 없음
    // ------------------------------------------

    if (!hasBehaviorData) {

        if (behaviorSummaryEl) {
            behaviorSummaryEl.style.display =
                "none";
        }


        if (miniCalendar) {

            miniCalendar.innerHTML = "";

            miniCalendar.style.display =
                "block";

            miniCalendar.style.marginTop =
                "16px";

            miniCalendar.style.marginBottom =
                "0px";

            miniCalendar.style.padding =
                "0px";

            miniCalendar.style.minHeight =
                "0px";


            const noDataEl =
                document.createElement("div");

            noDataEl.innerText =
                "기록 없음";

            noDataEl.style.margin =
                "0";

            noDataEl.style.padding =
                "0";

            noDataEl.style.lineHeight =
                "1";


            miniCalendar.appendChild(
                noDataEl
            );
        }


        if (behaviorSection) {
            behaviorSection.style.paddingBottom =
                "20px";
        }


    // ------------------------------------------
    // 행동 기록 있음
    // ------------------------------------------

    } else {

        if (behaviorSummaryEl) {
            behaviorSummaryEl.style.display =
                "block";
        }


        if (behaviorSection) {
            behaviorSection.style.paddingBottom =
                "20px";
        }


        if (miniCalendar) {

            miniCalendar.innerHTML = "";

            miniCalendar.style.display =
                "grid";

            miniCalendar.style.textAlign =
                "initial";

            miniCalendar.style.marginTop =
                "";

            miniCalendar.style.marginBottom =
                "";


            // 요일 헤더
            ["월", "화", "수", "목", "금"]
                .forEach(function (day) {

                    const header =
                        document.createElement("div");

                    header.className =
                        "mini-header";

                    header.innerText =
                        day;

                    miniCalendar.appendChild(
                        header
                    );
                });


            // 해당 월 마지막 날짜
            const lastDayNum =
                new Date(
                    year,
                    month + 1,
                    0
                ).getDate();


            // 날짜별 기록 저장
            const recordMap = {};


            monthRecords.forEach(function (record) {

                const recordDate =
                    parseDate(record.date);

                if (recordDate) {
                    recordMap[
                        recordDate.getDate()
                    ] = record;
                }
            });


            // 해당 월 1일의 요일
            const firstDayObj =
                new Date(
                    year,
                    month,
                    1
                );

            const startDayOfWeek =
                firstDayObj.getDay();


            let offset = 0;


            if (
                startDayOfWeek !== 0 &&
                startDayOfWeek !== 6
            ) {
                offset =
                    startDayOfWeek - 1;
            }


            // 시작 전 빈칸
            for (
                let i = 0;
                i < offset;
                i++
            ) {

                const empty =
                    document.createElement("div");

                empty.style.visibility =
                    "hidden";

                miniCalendar.appendChild(
                    empty
                );
            }


            // 날짜 생성
            for (
                let dayNum = 1;
                dayNum <= lastDayNum;
                dayNum++
            ) {

                const dateObj =
                    new Date(
                        year,
                        month,
                        dayNum
                    );

                const dayOfWeek =
                    dateObj.getDay();


                // 주말 제외
                if (
                    dayOfWeek === 0 ||
                    dayOfWeek === 6
                ) {
                    continue;
                }


                const record =
                    recordMap[dayNum];


                if (
                    record &&
                    record.behavior
                ) {

                    const cell =
                        document.createElement(
                            "div"
                        );

                    cell.className =
                        "mini-day";


                    if (
                        record.behavior === "good"
                    ) {

                        cell.classList.add(
                            "mini-good"
                        );

                    } else if (
                        record.behavior === "normal"
                    ) {

                        cell.classList.add(
                            "mini-normal"
                        );

                    } else if (
                        record.behavior === "hard"
                    ) {

                        cell.classList.add(
                            "mini-hard"
                        );
                    }


                    cell.title =
                        record.date;

                    miniCalendar.appendChild(
                        cell
                    );


                } else {

                    const emptyCell =
                        document.createElement(
                            "div"
                        );

                    emptyCell.style.visibility =
                        "hidden";

                    miniCalendar.appendChild(
                        emptyCell
                    );
                }
            }
        }
    }


    // ==========================================
    // 점심 TOP 1
    // ==========================================

    const lunchMap = {};


    monthRecords.forEach(function (record) {

        if (!record.lunch) return;


        const lunchName =
            record.lunch.trim();


        if (!lunchName) return;


        if (!lunchMap[lunchName]) {
            lunchMap[lunchName] = 0;
        }


        lunchMap[lunchName]++;
    });


    // 가장 많이 먹은 횟수
    let maxCount = 0;


    for (const lunch in lunchMap) {

        if (
            lunchMap[lunch] > maxCount
        ) {
            maxCount =
                lunchMap[lunch];
        }
    }


    const topLunchEl =
        document.getElementById(
            "topLunch"
        );


    if (topLunchEl) {

        const lunchSection =
            topLunchEl.closest(
                ".section"
            );


        topLunchEl.style.cssText = "";


        if (maxCount > 0) {

            const topLunches = [];


            for (const lunch in lunchMap) {

                if (
                    lunchMap[lunch] === maxCount
                ) {
                    topLunches.push(
                        lunch
                    );
                }
            }


            // 공동 1위
            if (topLunches.length > 1) {

                topLunchEl.innerText =
                    topLunches.join(" · ") +
                    " · 각 " +
                    maxCount +
                    "회";

            } else {

                topLunchEl.innerText =
                    topLunches[0] +
                    " · " +
                    maxCount +
                    "회";
            }


            topLunchEl.classList.add(
                "top-lunch-box"
            );


            if (lunchSection) {
                lunchSection.style.paddingBottom =
                    "20px";
            }


        } else {

            // 점심 기록 없음
            topLunchEl.innerText =
                "기록 없음";

            topLunchEl.classList.remove(
                "top-lunch-box"
            );

            topLunchEl.style.marginTop =
                "16px";

            topLunchEl.style.color =
                "#6c757d";


            if (lunchSection) {
                lunchSection.style.paddingBottom =
                    "20px";
            }
        }
    }
}


// ==========================================
// 이전 달
// ==========================================

const prevBtn =
    document.getElementById(
        "prevMonth"
    );


if (prevBtn) {

    prevBtn.addEventListener(
        "click",
        function () {

            currentDate.setMonth(
                currentDate.getMonth() - 1
            );

            drawReport();
        }
    );
}


// ==========================================
// 다음 달
// ==========================================

const nextBtn =
    document.getElementById(
        "nextMonth"
    );


if (nextBtn) {

    nextBtn.addEventListener(
        "click",
        function () {

            currentDate.setMonth(
                currentDate.getMonth() + 1
            );

            drawReport();
        }
    );
}


// ==========================================
// 실행
// ==========================================

loadRecords();
