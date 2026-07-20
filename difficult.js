console.log("difficult.js 실행됨");


import { app } from "./firebase.js";


import {
    getFirestore,
    collection,
    getDocs
}
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";



const db = getFirestore(app);



const difficultList =
document.getElementById("difficultList");





async function loadDifficultRecords(){


    const snapshot = await getDocs(

        collection(db,"difficultBehaviors")

    );



    let records = [];



    snapshot.forEach(function(doc){


        records.push({

            id: doc.id,

            ...doc.data()

        });


    });





    // 최신 날짜순 정렬

    records.sort(function(a,b){


        return new Date(b.date) - new Date(a.date);


    });





    difficultList.innerHTML = "";





    if(records.length === 0){


        difficultList.innerHTML =

        "<li>기록 없음</li>";


        return;


    }






    records.forEach(function(record){



        const li =

        document.createElement("li");




        li.innerText =


        record.date +

        "\n\n" +

        record.content;





        li.style.whiteSpace = "pre-line";

        li.style.cursor = "pointer";

        li.style.marginBottom = "20px";

        li.style.padding = "15px";

        li.style.background = "#fff";

        li.style.borderRadius = "12px";

        li.style.boxShadow =
        "0 2px 5px rgba(0,0,0,.1)";





        difficultList.appendChild(li);



    });



}




loadDifficultRecords();