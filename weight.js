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


const monthTitle =
    document.getElementById("monthTitle");


const ctx =
    document.getElementById("weightChart");


const weightList =
    document.getElementById("weightList");



const params = new URLSearchParams(location.search);

const monthParam = params.get("month");


let currentDate = monthParam
    ? new Date(monthParam + "-01")
    : new Date();


let chart;

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
    "평균 " + Number(value).toFixed(1) + "kg",
    chart.chartArea.left + 5,
    point.y
);

        ctx.restore();
    }
};



async function loadRecords() {


    const snapshot = await getDocs(

        collection(db, "records")

    );



    records = [];



    snapshot.forEach(function (doc) {


        records.push(doc.data());


    });




    // 날짜순 정렬

    records.sort(function (a, b) {


        return new Date(a.date) - new Date(b.date);


    });




    drawWeight();


}









function drawWeight() {



    // 화면 표시 전 날짜 재정렬

    records.sort(function (a, b) {


        return new Date(a.date) - new Date(b.date);


    });





    const year =
        currentDate.getFullYear();



    const month =
        currentDate.getMonth();





    monthTitle.innerText =

        year + "년 " + (month + 1) + "월";







    const labels = [];

const weights = [];

weightList.innerHTML = "";

let maxShown = false;
let minShown = false;


// 이번 달 체중 기록만 추출

const monthWeights = records.filter(function (record) {

    const recordDate = new Date(record.date);

    return (
        recordDate.getFullYear() === year &&
        recordDate.getMonth() === month &&
        record.weight
    );

});


const weightValues = monthWeights.map(function (record) {

    return Number(record.weight);

});


// 평균 / 최고 / 최저

const averageWeight =
    weightValues.reduce(function (sum, weight) {

        return sum + weight;

    }, 0) / weightValues.length;


const maxWeight =
    Math.max(...weightValues);


const minWeight =
    Math.min(...weightValues);




const week =
    ["일", "월", "화", "수", "목", "금", "토"];

    






    records.forEach(function (record) {





        const recordDate =

            new Date(record.date);







        if (


            recordDate.getFullYear() === year &&


            recordDate.getMonth() === month &&


            record.weight



        ) {






labels.push([
    record.date.substring(8,10),
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
    record.weight +
    "kg";


if (Number(record.weight) === maxWeight && !maxShown) {

    text += " (최고)";
    maxShown = true;

}

if (Number(record.weight) === minWeight && !minShown) {

    text += " (최저)";
    minShown = true;

}


li.innerText = text;


weightList.appendChild(li);



        }



    });







    if (chart) {


        chart.destroy();


    }







        chart = new Chart(ctx, {

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
                    data: weights.map(function () {

                        return Number(averageWeight.toFixed(1));

                    }),
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

        plugins: [averageLabelPlugin]

    });



}









document

    .getElementById("prevMonth")

    .addEventListener("click", function () {



        currentDate.setMonth(

            currentDate.getMonth() - 1

        );



        drawWeight();



    });









document

    .getElementById("nextMonth")

    .addEventListener("click", function () {



        currentDate.setMonth(

            currentDate.getMonth() + 1

        );



        drawWeight();



    });









loadRecords();