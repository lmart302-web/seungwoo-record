console.log("report.js 실행됨");


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


let currentDate = new Date();





async function loadRecords() {


    const snapshot = await getDocs(

        collection(db, "records")

    );



    records = [];



    snapshot.forEach(function (doc) {


        records.push(doc.data());


    });




    records.sort(function (a, b) {


        return new Date(a.date) - new Date(b.date);


    });




    drawReport();


}









function drawReport() {



    const year =
        currentDate.getFullYear();



    const month =
        currentDate.getMonth();





    monthTitle.innerText =

        year + "년 " + (month + 1) + "월";


    const runningLink = document.querySelector(".running-link");

    if (runningLink) {

        const monthValue =
            year + "-" + String(month + 1).padStart(2, "0");

        runningLink.href =
            "running.html?month=" + monthValue;

    }


    const weightLink = document.querySelector(".weight-link");

    if (weightLink) {

        const monthValue =
            year + "-" + String(month + 1).padStart(2, "0");

        weightLink.href =
            "weight.html?month=" + monthValue;

    }

    const monthRecords = records.filter(function (record) {



        const recordDate =

            new Date(record.date);




        return (

            recordDate.getFullYear() === year &&

            recordDate.getMonth() === month

        );



    });









    // 체중


    const weightRecords = monthRecords.filter(function (record) {



        return record.weight;



    });





    if (weightRecords.length) {



        const first =

            Number(weightRecords[0].weight);





        const last =

            Number(weightRecords[weightRecords.length - 1].weight);





        const diff =

            (last - first).toFixed(1);





        let result =

            first + "kg → " + last + "kg";

        if (diff > 0) {

            result += " (+" + diff + "kg)";

        }
        else if (diff < 0) {

            result += " (" + diff + "kg)";

        }
        else {

            result += " (변화 없음)";

        }


        // 최고 / 최저 체중 계산
        const maxWeight =

            Math.max(...weightRecords.map(function (record) {

                return Number(record.weight);

            }));


        const minWeight =

            Math.min(...weightRecords.map(function (record) {

                return Number(record.weight);

            }));


        result +=

            "\n\n⬆ 최고 : " + maxWeight + "kg" +

            "\n⬇ 최저 : " + minWeight + "kg";


        document.getElementById("weightSummary").innerText =

            result;



    }

    else {



        document.getElementById("weightSummary").innerText =

            "기록 없음";



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








    if (runningCount) {



        const runningAverage =

            Math.round(runningTotal / runningCount);





        const goalRate =

            Math.round((goalCount / runningCount) * 100);



        document.getElementById("runningSummary").innerText =


            "🎯 목표 달성 : " + goalCount + " / " + runningCount + "회 (" + goalRate + "%)\n\n" +

            "평균 운동시간 : " + runningAverage + "분";



    }

    else {



        document.getElementById("runningSummary").innerText =

            "기록 없음";



    }









    // 행동


    let good = 0;


    let normal = 0;


    let hard = 0;







    monthRecords.forEach(function (record) {



        if (record.behavior === "good") good++;


        if (record.behavior === "normal") normal++;


        if (record.behavior === "hard") hard++;



    });







    document.getElementById("goodCount").innerText = good;


    document.getElementById("normalCount").innerText = normal;


    document.getElementById("hardCount").innerText = hard;


    // ===== 행동 미니 달력 =====

    const miniCalendar =
        document.getElementById("behaviorMiniCalendar");

    miniCalendar.innerHTML = "";

    // 요일 제목
    ["월", "화", "수", "목", "금"].forEach(function (day) {

        const header =
            document.createElement("div");

        header.className = "mini-header";

        header.innerText = day;

        miniCalendar.appendChild(header);

    });

    // 이번 달 첫날
    const firstDay =
        new Date(year, month, 1);

    // 월요일 기준 시작 위치
    let start =
        firstDay.getDay();

    if (start === 0) {
        start = 6;
    }
    else {
        start--;
    }

    // 첫 주 빈칸
    for (let i = 0; i < start; i++) {

        const empty =
            document.createElement("div");

        empty.className =
            "mini-empty";

        miniCalendar.appendChild(empty);

    }

    // 날짜 출력
    monthRecords.forEach(function (record) {

        const recordDate =
            new Date(record.date);

        const day =
            recordDate.getDay();

        // 토,일은 표시 안함
        if (day === 0 || day === 6) {

            return;

        }

        const cell =
            document.createElement("div");

        cell.className =
            "mini-day";

        if (record.behavior === "good") {

            cell.classList.add("mini-good");

        }

        else if (record.behavior === "normal") {

            cell.classList.add("mini-normal");

        }

        else if (record.behavior === "hard") {

            cell.classList.add("mini-hard");

        }

        cell.title = record.date;

        miniCalendar.appendChild(cell);

    });






    // 점심 TOP1


    const lunchMap = {};






    monthRecords.forEach(function (record) {



        if (!record.lunch) return;





        if (!lunchMap[record.lunch]) {


            lunchMap[record.lunch] = 0;


        }




        lunchMap[record.lunch]++;



    });







    let topLunch = "기록 없음";


    let topCount = 0;








    for (const lunch in lunchMap) {



        if (lunchMap[lunch] > topCount) {



            topCount = lunchMap[lunch];


            topLunch = lunch;



        }



    }







    if (topCount) {



        document.getElementById("topLunch").innerText =

            topLunch + " (" + topCount + "회)";



    }

    else {



        document.getElementById("topLunch").innerText =

            "기록 없음";



    }



}









document

    .getElementById("prevMonth")

    .addEventListener("click", function () {



        currentDate.setMonth(

            currentDate.getMonth() - 1

        );



        drawReport();



    });









document

    .getElementById("nextMonth")

    .addEventListener("click", function () {



        currentDate.setMonth(

            currentDate.getMonth() + 1

        );



        drawReport();



    });









loadRecords();