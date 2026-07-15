console.log("running.js 실행됨");


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
    document.getElementById("runningChart");


// 기록 표시 영역
const runningList =
    document.getElementById("runningList");



let currentDate = new Date();


let chart;





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



    drawRunning();


}







function drawRunning() {



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

    const runningTimes = [];


    let listHTML = "";







    records.forEach(function (record) {



        const recordDate =

            new Date(record.date);





        if (


            recordDate.getFullYear() === year &&


            recordDate.getMonth() === month &&


            record.running



        ) {



            const time =

                Number(record.running);




            labels.push(

                record.date.substring(8, 10) + "일"

            );



            runningTimes.push(time);




            li.innerText =

                record.date +

                " : " +

                record.running +

                "분";



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


                    label: "운동시간(분)",


                    data: runningTimes



                }



            ]



        },



        options: {



            responsive: true,



            scales: {



                y: {



                    beginAtZero: true



                }



            }



        }



    });








    // 운동 기록 표시


    if (runningList) {



        if (listHTML) {


            runningList.innerHTML = listHTML;


        }

        else {


            runningList.innerHTML =

                "기록 없음";


        }



    }



}









document

    .getElementById("prevMonth")

    .addEventListener("click", function () {



        currentDate.setMonth(

            currentDate.getMonth() - 1

        );



        drawRunning();



    });









document

    .getElementById("nextMonth")

    .addEventListener("click", function () {



        currentDate.setMonth(

            currentDate.getMonth() + 1

        );



        drawRunning();



    });









loadRecords();