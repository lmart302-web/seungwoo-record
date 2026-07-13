import { app } from "./firebase.js";
import { getFirestore, collection, getDocs } 
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);

let records = [];

const calendar = document.getElementById("calendar");
const monthTitle = document.getElementById("monthTitle");

let currentDate = new Date();


async function loadRecords(){

    console.log("Firebase 읽기 시작");

    const snapshot = await getDocs(
        collection(db, "records")
    );

    console.log("가져온 개수:", snapshot.size);

    records = [];

    snapshot.forEach(function(doc){

        console.log("데이터:", doc.data());

        records.push(doc.data());

    });

    drawCalendar();

}



function drawCalendar(){

    calendar.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();


    monthTitle.innerText =
    year + "년 " + (month + 1) + "월";


    const days = [
        "일",
        "월",
        "화",
        "수",
        "목",
        "금",
        "토"
    ];


    days.forEach(function(day){

        const div = document.createElement("div");

        div.className = "day-name";

        div.innerText = day;

        calendar.appendChild(div);

    });



    const firstDay =
    new Date(year, month, 1).getDay();


    const lastDate =
    new Date(year, month + 1, 0).getDate();



    for(let i = 0; i < firstDay; i++){

        const empty = document.createElement("div");

        calendar.appendChild(empty);

    }



    for(let i = 1; i <= lastDate; i++){

        const box = document.createElement("div");

        box.className = "calendar-day";


        const date =
        year +
        "-" +
        String(month + 1).padStart(2,"0") +
        "-" +
        String(i).padStart(2,"0");



        let behavior = "";

        let html =
        "<strong>" + i + "</strong>";



        const record =
        records.find(function(item){

            return item.date === date;

        });



        if(record){


            if(record.behavior === "good"){
                behavior = "🟢";
            }
            else if(record.behavior === "normal"){
                behavior = "🟡";
            }
            else if(record.behavior === "hard"){
                behavior = "🔴";
            }


            html =
            "<strong>" + i + " " + behavior + "</strong>";



            if(record.morning){

                html +=
                "<div>☀️ " +
                record.morning.replace(/\n/g,"<br>") +
                "</div>";

            }



            if(record.lunch){

                html +=
                "<div class='lunch'>🍚 " +
                record.lunch +
                "</div>";

            }



            if(record.afternoon){

                html +=
                "<div>🌙 " +
                record.afternoon.replace(/\n/g,"<br>") +
                "</div>";

            }



            if(record.running || record.weight){

                html += "<div>";

                if(record.running){

                    html += "🏃" + record.running + "분 ";

                }


                if(record.weight){

                    html += "⚖️" + record.weight + "kg";

                }

                html += "</div>";

            }

        }



        const dayOfWeek =
        new Date(year, month, i).getDay();


        if(dayOfWeek === 0){

            box.classList.add("sunday");

        }


        if(dayOfWeek === 6){

            box.classList.add("saturday");

        }



        box.innerHTML = html;

        calendar.appendChild(box);

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