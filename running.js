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


// 통계 표시 영역
const totalCount =
document.getElementById("totalCount");

const totalTime =
document.getElementById("totalTime");

const averageTime =
document.getElementById("averageTime");

const goalCount =
document.getElementById("goalCount");



let currentDate = new Date();


let chart;





async function loadRecords(){


    const snapshot = await getDocs(

        collection(db,"records")

    );


    records = [];



    snapshot.forEach(function(doc){


        records.push(doc.data());


    });



    records.sort(function(a,b){


        return new Date(a.date) - new Date(b.date);


    });



    drawRunning();


}









function drawRunning(){



    records.sort(function(a,b){


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



    let count = 0;

    let total = 0;

    let goal = 0;







    records.forEach(function(record){



        const recordDate =

        new Date(record.date);






        if(


            recordDate.getFullYear() === year &&


            recordDate.getMonth() === month &&


            record.running



        ){



            const time =

            Number(record.running);



            labels.push(

                record.date.substring(8,10) + "일"

            );



            runningTimes.push(time);




            count++;


            total += time;



            if(time >= 20){

                goal++;

            }



        }



    });








    if(chart){


        chart.destroy();


    }








    chart = new Chart(ctx, {



        type:"line",



        data:{



            labels:labels,



            datasets:[



                {


                    label:"런닝머신(분)",


                    data:runningTimes



                }



            ]



        },



        options:{



            responsive:true,



            scales:{



                y:{



                    beginAtZero:true



                }



            }



        }



    });






    // 통계 표시


    const average =

    count > 0

    ? Math.round(total / count)

    : 0;





    if(totalCount){

        totalCount.innerText =

        "운동 횟수\n" + count + "회";

    }




    if(totalTime){

        totalTime.innerText =

        "총 이용시간\n" + total + "분";

    }




    if(averageTime){

        averageTime.innerText =

        "평균 이용시간\n" + average + "분";

    }




    if(goalCount){

        goalCount.innerText =

        "🎯 20분 목표 달성\n" + goal + "회";

    }



}









document

.getElementById("prevMonth")

.addEventListener("click",function(){



    currentDate.setMonth(

        currentDate.getMonth()-1

    );



    drawRunning();



});









document

.getElementById("nextMonth")

.addEventListener("click",function(){



    currentDate.setMonth(

        currentDate.getMonth()+1

    );



    drawRunning();



});









loadRecords();