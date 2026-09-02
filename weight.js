console.log("weight.js 실행됨");


import { app } from "./firebase.js";

import {
    getFirestore,
    collection,
    getDocs
}
    from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const db = getFirestore(app);


let records = [];

let chart;
let yearChart;
let allChart;



/* =========================
   월간 요소
========================= */

const monthTitle =
    document.getElementById("monthTitle");

const ctx =
    document.getElementById("weightChart");

const weightList =
    document.getElementById("weightList");



/* =========================
   연간 요소
========================= */

const yearTitle =
    document.getElementById("yearTitle");

const yearCtx =
    document.getElementById("yearWeightChart");

const yearWeightList =
    document.getElementById("yearWeightList");



/* =========================
   전체 요소
========================= */

const allCtx =
    document.getElementById("allWeightChart");

const allWeightList =
    document.getElementById("allWeightList");



/* =========================
   현재 날짜
========================= */

const params =
    new URLSearchParams(location.search);

const monthParam =
    params.get("month");


let currentDate =
    monthParam
        ? new Date(monthParam + "-01")
        : new Date();


let currentYear =
    currentDate.getFullYear();



/* =========================
   월간 평균선 라벨
========================= */

const averageLabelPlugin = {

    id: "averageLabel",

    afterDatasetsDraw: function (chart) {

        const dataset =
            chart.data.datasets[1];

        if (!dataset || !dataset.data.length) {
            return;
        }

        const meta =
            chart.getDatasetMeta(1);

        const point =
            meta.data[meta.data.length - 1];

        if (!point) {
            return;
        }

        const value =
            dataset.data[dataset.data.length - 1];

        const ctx =
            chart.ctx;

        ctx.save();

        ctx.font = "12px sans-serif";

        ctx.textAlign = "left";

        ctx.textBaseline = "middle";


        ctx.fillText(
            "평균 " +
            Number(value).toFixed(1) +
            "kg",

            chart.chartArea.left + 5,

            point.y
        );


        ctx.restore();

    }

};



/* =========================
   데이터 불러오기
========================= */

async function loadRecords() {

    const snapshot =
        await getDocs(
            collection(db, "records")
        );


    records = [];


    snapshot.forEach(function (doc) {

        records.push(doc.data());

    });


    records.sort(function (a, b) {

        return new Date(a.date) -
            new Date(b.date);

    });


    drawWeight();

}



/* =========================
   월간 그래프
========================= */

function drawWeight() {

    records.sort(function (a, b) {

        return new Date(a.date) -
            new Date(b.date);

    });


    const year =
        currentDate.getFullYear();


    const month =
        currentDate.getMonth();


    monthTitle.innerText =
        year +
        "년 " +
        (month + 1) +
        "월";


    const labels = [];

    const weights = [];


    weightList.innerHTML = "";


    let maxShown = false;

    let minShown = false;



    /* 이번 달 체중 기록 */

    const monthWeights =
        records.filter(function (record) {

            const recordDate =
                new Date(record.date);


            return (
                recordDate.getFullYear() === year &&
                recordDate.getMonth() === month &&
                record.weight
            );

        });



    const weightValues =
        monthWeights.map(function (record) {

            return Number(record.weight);

        });



    let averageWeight = 0;

    let maxWeight = 0;

    let minWeight = 0;



    if (weightValues.length > 0) {

        averageWeight =
            weightValues.reduce(
                function (sum, weight) {

                    return sum + weight;

                },
                0
            ) / weightValues.length;


        maxWeight =
            Math.max(...weightValues);


        minWeight =
            Math.min(...weightValues);

    }



    const week =
        ["일", "월", "화", "수", "목", "금", "토"];



    /* 체중 기록 */

    monthWeights.forEach(function (record) {

        const recordDate =
            new Date(record.date);


        labels.push([

            record.date.substring(8, 10),

            week[recordDate.getDay()]

        ]);


        weights.push(
            Number(record.weight)
        );



        const li =
            document.createElement("li");


        let text =
            record.date.substring(5, 10) +
            " (" +
            week[recordDate.getDay()] +
            ") : " +
            Number(record.weight).toFixed(1) +
            "kg";



        if (
            Number(record.weight) === maxWeight &&
            !maxShown
        ) {

            text += " (최고)";

            maxShown = true;

        }



        if (
            Number(record.weight) === minWeight &&
            !minShown
        ) {

            text += " (최저)";

            minShown = true;

        }



        li.innerText = text;

        weightList.appendChild(li);

    });



    /* 기존 그래프 삭제 */

    if (chart) {

        chart.destroy();

    }



    /* 월간 그래프 */

    chart =
        new Chart(ctx, {

            type: "line",

            data: {

                labels: labels,

                datasets: [

                    {

                        label: "체중(kg)",

                        data: weights,

                        pointRadius: 5

                    },


                    {

                        label: "평균 체중",

                        data: weights.map(
                            function () {

                                return Number(
                                    averageWeight.toFixed(1)
                                );

                            }
                        ),

                        borderDash: [5, 5],

                        pointRadius: 0

                    }

                ]

            },


            options: {

                responsive: true,

                scales: {

                    y: {

                        beginAtZero: false

                    }

                }

            },


            plugins: [
                averageLabelPlugin
            ]

        });

}



/* =========================
   연간 그래프
========================= */

function drawYearlyWeight() {

    yearTitle.innerText =
        currentYear + "년";


    const labels = [

        "1월",
        "2월",
        "3월",
        "4월",
        "5월",
        "6월",
        "7월",
        "8월",
        "9월",
        "10월",
        "11월",
        "12월"

    ];


    const monthlyAverages = [];


    yearWeightList.innerHTML = "";



    /* 1월 ~ 12월 */

    for (
        let month = 0;
        month < 12;
        month++
    ) {

        const monthWeights =
            records.filter(function (record) {

                if (!record.weight) {
                    return false;
                }


                const recordDate =
                    new Date(record.date);


                return (

                    recordDate.getFullYear() ===
                    currentYear &&

                    recordDate.getMonth() ===
                    month

                );

            });



        /* 해당 월에 기록이 없으면 빈칸 */

        if (!monthWeights.length) {

            monthlyAverages.push(null);

            continue;

        }



        /* 해당 월 평균 */

        const total =
            monthWeights.reduce(
                function (sum, record) {

                    return sum +
                        Number(record.weight);

                },
                0
            );


        const average =
            total / monthWeights.length;


        const averageValue =
            Number(average.toFixed(1));


        monthlyAverages.push(
            averageValue
        );



        /* 월 평균 기록 표시 */

        const li =
            document.createElement("li");


        li.innerText =
            (month + 1) +
            "월 : " +
            averageValue.toFixed(1) +
            "kg";


        yearWeightList.appendChild(li);

    }



    /* 기존 연간 그래프 삭제 */

    if (yearChart) {

        yearChart.destroy();

    }



    /* 연간 그래프 */

    yearChart =
        new Chart(yearCtx, {

            type: "line",


            data: {

                labels: labels,


                datasets: [

                    {

                        label: "월평균 체중",

                        data: monthlyAverages,

                        pointRadius: 5,

                        spanGaps: false

                    }

                ]

            },


            options: {

                responsive: true,


                scales: {

                    y: {

                        beginAtZero: false

                    }

                }

            }

        });

}



/* =========================
   전체 그래프
========================= */

function drawAllWeight() {

    allWeightList.innerHTML = "";


    /* =========================
       전체 데이터의 연도 / 월 범위 찾기
    ========================= */

    const validRecords =
        records.filter(function (record) {

            return record.weight &&
                record.date;

        });


    if (!validRecords.length) {
        return;
    }


    const dates =
        validRecords.map(function (record) {

            return new Date(record.date);

        });


    dates.sort(function (a, b) {

        return a - b;

    });


    const startYear =
        dates[0].getFullYear();

    const startMonth =
        dates[0].getMonth();


    const lastDate =
        dates[dates.length - 1];

    const endYear =
        lastDate.getFullYear();

    const endMonth =
        lastDate.getMonth();



    /* =========================
       실제 시간 순서대로 월 생성
    ========================= */

    const labels = [];
    const monthlyData = [];

    const monthlyRecords = [];


    let year = startYear;
    let month = startMonth;


    while (
        year < endYear ||
        (
            year === endYear &&
            month <= endMonth
        )
    ) {

        const monthRecords =
            validRecords.filter(function (record) {

                const recordDate =
                    new Date(record.date);

                return (
                    recordDate.getFullYear() === year &&
                    recordDate.getMonth() === month
                );

            });


        let average = null;


        if (monthRecords.length) {

            const total =
                monthRecords.reduce(
                    function (sum, record) {

                        return sum +
                            Number(record.weight);

                    },
                    0
                );


            average =
                Number(
                    (
                        total /
                        monthRecords.length
                    ).toFixed(1)
                );

        }


        /* 연도가 바뀌는 지점 표시 */

        labels.push(

            String(year).slice(2) +
            "." +
            String(month + 1).padStart(2, "0")

        );


        monthlyData.push(average);


        monthlyRecords.push({

            year: year,

            month: month,

            average: average

        });


        month++;


        if (month === 12) {

            month = 0;
            year++;

        }

    }



    /* =========================
   전체 기록 목록
========================= */

    monthlyRecords.forEach(function (item) {

        /* 기록이 없는 달은 표시하지 않음 */

        if (item.average === null) {
            return;
        }


        const li =
            document.createElement("li");


        li.innerText =
            String(item.year).slice(2) +
            "." +
            String(item.month + 1).padStart(2, "0") +
            " : " +
            item.average +
            "kg";


        allWeightList.appendChild(li);

    });





    /* =========================
       기존 그래프 삭제
    ========================= */

    if (allChart) {

        allChart.destroy();

    }



    /* =========================
       전체 그래프
    ========================= */

    allChart =
        new Chart(allCtx, {

            type: "line",

            data: {

                labels: labels,

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

                responsive: true,


                interaction: {

                    mode: "index",

                    intersect: false

                },


                scales: {

                    y: {

                        beginAtZero: false

                    }

                }

            }

        });

}



/* =========================
   월간 버튼
========================= */

document
    .getElementById("monthlyBtn")
    .addEventListener(
        "click",
        function () {

            document
                .getElementById("monthlyView")
                .style.display = "block";


            document
                .getElementById("yearlyView")
                .style.display = "none";


            document
                .getElementById("allView")
                .style.display = "none";


            document
                .getElementById("monthlyBtn")
                .classList.add("active");


            document
                .getElementById("yearlyBtn")
                .classList.remove("active");


            document
                .getElementById("allBtn")
                .classList.remove("active");

        }
    );



/* =========================
   연간 버튼
========================= */

document
    .getElementById("yearlyBtn")
    .addEventListener(
        "click",
        function () {

            document
                .getElementById("monthlyView")
                .style.display = "none";


            document
                .getElementById("yearlyView")
                .style.display = "block";


            document
                .getElementById("allView")
                .style.display = "none";


            document
                .getElementById("yearlyBtn")
                .classList.add("active");


            document
                .getElementById("monthlyBtn")
                .classList.remove("active");


            document
                .getElementById("allBtn")
                .classList.remove("active");


            drawYearlyWeight();

        }
    );



/* =========================
   전체 버튼
========================= */

document
    .getElementById("allBtn")
    .addEventListener(
        "click",
        function () {

            document
                .getElementById("monthlyView")
                .style.display = "none";


            document
                .getElementById("yearlyView")
                .style.display = "none";


            document
                .getElementById("allView")
                .style.display = "block";


            document
                .getElementById("allBtn")
                .classList.add("active");


            document
                .getElementById("monthlyBtn")
                .classList.remove("active");


            document
                .getElementById("yearlyBtn")
                .classList.remove("active");


            drawAllWeight();

        }
    );



/* =========================
   이전 달
========================= */

document
    .getElementById("prevMonth")
    .addEventListener(
        "click",
        function () {

            currentDate.setMonth(
                currentDate.getMonth() - 1
            );


            drawWeight();

        }
    );



/* =========================
   다음 달
========================= */

document
    .getElementById("nextMonth")
    .addEventListener(
        "click",
        function () {

            currentDate.setMonth(
                currentDate.getMonth() + 1
            );


            drawWeight();

        }
    );



/* =========================
   이전 연도
========================= */

document
    .getElementById("prevYear")
    .addEventListener(
        "click",
        function () {

            currentYear--;

            drawYearlyWeight();

        }
    );



/* =========================
   다음 연도
========================= */

document
    .getElementById("nextYear")
    .addEventListener(
        "click",
        function () {

            currentYear++;

            drawYearlyWeight();

        }
    );



/* =========================
   시작
========================= */

loadRecords();