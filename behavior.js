import { app } from "./firebase.js";

import {
    getFirestore,
    doc,
    getDoc,
    updateDoc,
    setDoc,
    deleteDoc
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


// 오늘 날짜 기록 불러오기
loadBehavior(dateInput.value);


// 날짜 변경 시 기존 기록 불러오기

dateInput.addEventListener("change", async function () {

    loadBehavior(dateInput.value);

});


async function loadBehavior(date) {

    if (!date) {

        return;

    }

    const docRef =
        doc(db, "records", date);

    const snapshot =
        await getDoc(docRef);

    // 기본값
    behaviorSelect.value = "good";

    if (snapshot.exists()) {

        const record =
            snapshot.data();

        behaviorSelect.value =
            record.behavior || "good";

    }

}


// 저장

const saveButton =
    document.getElementById("saveBtn");


saveButton.addEventListener("click", async function () {

    const date =
        dateInput.value;


    if (!date) {

        alert("날짜를 선택하세요.");

        return;

    }

    if(behaviorSelect.value === "delete"){

    const check =
    confirm("해당 날짜의 모든 기록을 삭제하시겠습니까?");


    if(!check){

        return;

    }


    await deleteDoc(
        doc(db,"records",date)
    );


    alert("기록이 삭제되었습니다.");

    location.href = "calendar.html";

    return;

}

    const docRef =
        doc(db, "records", date);

    const snapshot =
        await getDoc(docRef);


    // 기존 기록이 있으면 업데이트

    if (snapshot.exists()) {

        await updateDoc(docRef, {

            behavior: behaviorSelect.value

        });

    }

    // 기록이 없어도 휴강은 저장 가능

    else if (behaviorSelect.value === "holiday") {

        await setDoc(docRef, {

            date: date,

            behavior: "holiday"

        });

    }

    // 일반 상태는 기존 기록이 있어야 저장

    else {

        alert("먼저 해당 날짜의 기록을 입력하세요.");

        return;

    }


    if (behaviorSelect.value === "holiday") {

        alert("휴강이 저장되었습니다.");
        location.href = "calendar.html";

    } else {

        alert("행동 상태가 저장되었습니다.");
        location.href = "calendar.html";
    }

});