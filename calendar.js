console.log("calendar.js 실행됨");


import { app } from "./firebase.js";

import { 
    getFirestore, 
    collection, 
    getDocs 
} 
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const db = getFirestore(app);


let records = [];


const calendar =
document.getElementById("calendar");


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



    drawCalendar();


}









function drawCalendar(){



    calendar.innerHTML = "";



    const year =
    currentDate.getFullYear();



    const month =
    currentDate.getMonth();





    monthTitle.innerText =

    year + "년 " + (month + 1) + "월";






    const days = [

        "월",
        "화",
        "수",
        "목",
        "금"

    ];






    days.forEach(function(day){


        const div =

        document.createElement("div");



        div.className = "day-name";



        div.innerText = day;



        calendar.appendChild(div);



    });








    const lastDate =

    new Date(year, month + 1, 0).getDate();





    let count = 0;







    for(let i = 1; i <= lastDate; i++){



        const dateObj =

        new Date(year, month, i);





        const week =

        dateObj.getDay();







        // 토요일(6), 일요일(0) 제외

        if(week === 0 || week === 6){

            continue;

        }







        // 첫 주 빈칸 생성

        if(count === 0){



            const firstWeek =

            week - 1;




            for(let j = 0; j < firstWeek; j++){



                const empty =

                document.createElement("div");



                calendar.appendChild(empty);



                count++;



            }



        }









        const box =

        document.createElement("div");



        box.className =

        "calendar-day";







        const date =

        year +

        "-" +

        String(month + 1).padStart(2,"0") +

        "-" +

        String(i).padStart(2,"0");







        let html =

        "<strong>" + i;







        const record =

        records.find(function(item){



            return item.date === date;



        });







        if(record){





            let behavior = "";




            if(record.behavior === "good"){


                behavior = " 🟢";


            }

            else if(record.behavior === "normal"){


                behavior = " 🟡";


            }

            else if(record.behavior === "hard"){


                behavior = " 🔴";


            }





            html += behavior;

        }






        html += "</strong>";







        if(record){


    if(record.holiday){


        html +=
        "<div class='holiday-text'>🚫 휴강</div>";


        box.classList.add("holiday");


    }
    else{


        html +=

        "<div class='record-line'>☀️ " +

        (record.morning || "") +

        "</div>";





        html +=

        "<div class='record-line'>🍚 " +

        (record.lunch || "") +

        "</div>";





        html +=

        "<div class='record-line'>🌙 " +

        (record.afternoon || "") +

        "</div>";





        html +=

        "<div class='record-line'>🏃 " +

        (record.running ? record.running + "분" : "") +

        "</div>";





        html +=

        "<div class='record-line'>⚖️ " +

        (record.weight ? record.weight + "kg" : "") +

        "</div>";

    }


}
else{


    html +=
    "<div class='record-line'></div>";

    html +=
    "<div class='record-line'></div>";

    html +=
    "<div class='record-line'></div>";

    html +=
    "<div class='record-line'></div>";

    html +=
    "<div class='record-line'></div>";

}






        box.innerHTML = html;



        calendar.appendChild(box);



        count++;




    }



}









document

.getElementById("prevMonth")

.addEventListener("click",function(){



    currentDate.setMonth(

        currentDate.getMonth()-1

    );



    drawCalendar();



});









document

.getElementById("nextMonth")

.addEventListener("click",function(){



    currentDate.setMonth(

        currentDate.getMonth()+1

    );



    drawCalendar();



});









loadRecords();