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




    drawReport();


}









function drawReport(){



    const year =
    currentDate.getFullYear();



    const month =
    currentDate.getMonth();





    monthTitle.innerText =

    year + "년 " + (month + 1) + "월";







    const monthRecords = records.filter(function(record){



        const recordDate =

        new Date(record.date);




        return (

            recordDate.getFullYear() === year &&

            recordDate.getMonth() === month

        );



    });









    // 체중


    const weightRecords = monthRecords.filter(function(record){



        return record.weight;



    });





    if(weightRecords.length){



        const first =

        Number(weightRecords[0].weight);





        const last =

        Number(weightRecords[weightRecords.length - 1].weight);





        const diff =

        (last - first).toFixed(1);





        let result =


        first + "kg → " + last + "kg";







        if(diff > 0){


            result += " (+" + diff + "kg)";


        }

        else if(diff < 0){


            result += " (" + diff + "kg)";


        }

        else{


            result += " (변화 없음)";


        }






        document.getElementById("weightSummary").innerText =

        result;



    }

    else{



        document.getElementById("weightSummary").innerText =

        "기록 없음";



    }









    // 운동 기록


    let runningTotal = 0;

    let runningCount = 0;

    let goalCount = 0;



    monthRecords.forEach(function(record){



        if(record.running){



            const time = Number(record.running);



            runningTotal += time;



            runningCount++;




            if(time >= 20){


                goalCount++;


            }



        }



    });








    if(runningCount){



        const runningAverage =

        Math.round(runningTotal / runningCount);





        document.getElementById("runningSummary").innerText =



        "운동 횟수 : " + runningCount + "회\n\n" +

        "총 운동시간 : " + runningTotal + "분\n\n" +

        "평균 운동시간 : " + runningAverage + "분\n\n" +

        "🎯 20분 목표 달성 : " + goalCount + "회";



    }

    else{



        document.getElementById("runningSummary").innerText =

        "기록 없음";



    }









    // 행동


    let good = 0;


    let normal = 0;


    let hard = 0;







    monthRecords.forEach(function(record){



        if(record.behavior === "good") good++;


        if(record.behavior === "normal") normal++;


        if(record.behavior === "hard") hard++;



    });







    document.getElementById("goodCount").innerText = good;


    document.getElementById("normalCount").innerText = normal;


    document.getElementById("hardCount").innerText = hard;









    // 점심 TOP1


    const lunchMap = {};






    monthRecords.forEach(function(record){



        if(!record.lunch) return;





        if(!lunchMap[record.lunch]){


            lunchMap[record.lunch] = 0;


        }




        lunchMap[record.lunch]++;



    });







    let topLunch = "기록 없음";


    let topCount = 0;








    for(const lunch in lunchMap){



        if(lunchMap[lunch] > topCount){



            topCount = lunchMap[lunch];


            topLunch = lunch;



        }



    }







    if(topCount){



        document.getElementById("topLunch").innerText =

        topLunch + " (" + topCount + "회)";



    }

    else{



        document.getElementById("topLunch").innerText =

        "기록 없음";



    }



}









document

.getElementById("prevMonth")

.addEventListener("click",function(){



    currentDate.setMonth(

        currentDate.getMonth()-1

    );



    drawReport();



});









document

.getElementById("nextMonth")

.addEventListener("click",function(){



    currentDate.setMonth(

        currentDate.getMonth()+1

    );



    drawReport();



});









loadRecords();