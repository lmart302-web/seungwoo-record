import { app } from "./firebase.js";

import {
    getFirestore,
    doc,
    getDoc,
    updateDoc
}
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const db = getFirestore(app);


const behaviorSelect =
document.getElementById("behavior");


const dateInput =
document.getElementById("date");


// 오늘 날짜 기본 설정

const today = new Date();

const yyyy = today.getFullYear();

const mm = String(today.getMonth() + 1).padStart(2, "0");

const dd = String(today.getDate()).padStart(2, "0");


dateInput.value =
yyyy + "-" + mm + "-" + dd;


// 날짜 변경 시 기존 기록 불러오기

dateInput.addEventListener("change", async function(){

    const date = dateInput.value;

    if(!date){

        return;

    }


    const docRef =
    doc(db,"records",date);


    const snapshot =
    await getDoc(docRef);


    // 기본값 안정

    behaviorSelect.value = "good";


    if(snapshot.exists()){

        const record =
        snapshot.data();


        behaviorSelect.value =
        record.behavior || "good";

    }

});


// 저장

const saveButton =
document.getElementById("saveBtn");


saveButton.addEventListener("click", async function(){

    const date =
    dateInput.value;


    if(!date){

        alert("날짜를 선택하세요.");

        return;

    }


    const docRef =
    doc(db,"records",date);


    const snapshot =
    await getDoc(docRef);


    if(!snapshot.exists()){

        alert("먼저 해당 날짜의 기록을 입력하세요.");

        return;

    }


    await updateDoc(docRef,{

        behavior: behaviorSelect.value,

        holiday:false

    });


    alert("행동상태가 저장되었습니다.");

    location.href = "calendar.html";

});