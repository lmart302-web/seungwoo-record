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





if (!id) {


    alert("기록 정보를 찾을 수 없습니다.");

    location.href = "difficult.html";


}






async function loadRecord() {



    const docRef =

        doc(db, "difficultBehaviors", id);




    const snapshot =

        await getDoc(docRef);





    if (!snapshot.exists()) {


        alert("기록이 없습니다.");

        location.href = "difficult.html";

        return;

    }







    const record =

        snapshot.data();







    const date = new Date(record.date);

    const week = ["일", "월", "화", "수", "목", "금", "토"];

    document.getElementById("viewDate").innerText =
        record.date + " (" + week[date.getDay()] + ")";






    if (record.level === "hard") {

    document.getElementById("viewLevel").innerText =
        "🔴 어려운 행동";

}
else if (record.level === "other") {

    document.getElementById("viewLevel").innerText =
        "🥶 기타";

}
else if (record.level === "home") {

    document.getElementById("viewLevel").innerText =
        "🏠 가정";

}
else {

    // 기존 warning 데이터와 새 normal 데이터 모두 보통으로 표시
    document.getElementById("viewLevel").innerText =
        "🟡 보통";

}






    document.getElementById("viewContent").innerText =

        record.content;



}





loadRecord();