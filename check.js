import { app } from "./firebase.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc
}
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const db = getFirestore(app);

let checks = {};

console.log("check.js 실행됨");

const calendar =
document.getElementById("calendar");

const monthTitle =
document.getElementById("monthTitle");

let currentDate = new Date();

async function loadChecks(){

    checks = {};

    const snapshot = await getDocs(
        collection(db,"checks")
    );

    snapshot.forEach(function(item){

        const data = item.data();

        checks[data.date] = data.state;

    });

}

function setColor(box,state){

    box.style.background="white";

    if(state===1){

        box.style.background="#b7f5b7";

    }

    if(state===2){

        box.style.background="#fff2a8";

    }

    if(state===3){

        box.style.background="#ffc2c2";

    }

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

        div.className =
        "day-name";

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

        // 토, 일 제외
        if(week === 0 || week === 6){

            continue;

        }

        if(count === 0){

            const firstWeek =
            week - 1;

            for(let j = 0; j < firstWeek; j++){

                calendar.appendChild(
                    document.createElement("div")
                );

                count++;

            }

        }

        const box =
        document.createElement("div");

        box.className =
        "calendar-day check-day";

        box.innerHTML =
        "<strong>" + i + "</strong>";

        const date =

year + "-" +
String(month+1).padStart(2,"0") + "-" +
String(i).padStart(2,"0");


let state = checks[date] || 0;


setColor(box,state);


box.addEventListener("click",async function(){

    state++;

    if(state>3){

        state=0;

    }

    checks[date]=state;

    setColor(box,state);

    await setDoc(

        doc(db,"checks",date),

        {

            date:date,

            state:state

        }

    );

});

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

async function start(){

    await loadChecks();

    drawCalendar();

}

start();