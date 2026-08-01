import { app } from "./firebase.js";

import {
    getFirestore,
    doc,
    setDoc,
    getDoc
}
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const db = getFirestore(app);


const saveButton =
document.getElementById("saveButton");


saveButton.addEventListener("click", async function(){

    const record = {

        date:
        document.getElementById("recordDate").value,

        morning:
        document.getElementById("morning").value.trim(),

        lunch:
        document.getElementById("lunch").value.trim(),

        afternoon:
        document.getElementById("afternoon").value.trim(),

        running:
        document.getElementById("running").value,

        weight:
        document.getElementById("weight").value,

        behavior:"",

    };


    if(!record.date){

    alert("날짜를 선택하세요.");

    return;

}


if(!record.morning){

    alert("오전일과를 입력해주세요.");

    return;

}


if(!record.lunch){

    alert("점심 내용을 입력해주세요.");

    return;

}


if(!record.afternoon){

    alert("오후일과를 입력해주세요.");

    return;

}




    const docRef =
doc(db,"records",record.date);

const snapshot =
await getDoc(docRef);

if(snapshot.exists()){

    const oldRecord =
    snapshot.data();

    record.behavior =
    oldRecord.behavior || "";

}

    await setDoc(

        doc(db,"records",record.date),

        record

    );


    alert("기록이 저장되었습니다.");

location.href = "calendar.html";

});