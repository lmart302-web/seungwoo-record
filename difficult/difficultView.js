console.log("difficultView.js 실행됨");


import { app } from "../firebase.js";


import {
    getFirestore,
    doc,
    getDoc
}
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";



const db = getFirestore(app);





const params =

new URLSearchParams(location.search);



const id =

params.get("id");





if(!id){


    alert("기록 정보를 찾을 수 없습니다.");

    location.href="difficult.html";


}






async function loadRecord(){



    const docRef =

    doc(db,"difficultBehaviors",id);




    const snapshot =

    await getDoc(docRef);





    if(!snapshot.exists()){


        alert("기록이 없습니다.");

        location.href="difficult.html";

        return;

    }







    const record =

    snapshot.data();







    document.getElementById("viewDate").innerText =

    record.date;






    if(record.level === "hard"){


        document.getElementById("viewLevel").innerText =

        "🔴 어려움";


    }
    else{


        document.getElementById("viewLevel").innerText =

        "🟡 주의";


    }






    document.getElementById("viewContent").innerText =

    record.content;



}





loadRecord();