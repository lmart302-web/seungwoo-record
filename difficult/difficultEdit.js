console.log("difficultEdit.js 실행됨");


import { app } from "../firebase.js";


import {
    getFirestore,
    doc,
    getDoc,
    updateDoc
}
    from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";



const db = getFirestore(app);





const params =

    new URLSearchParams(location.search);



const id =

    params.get("id");





let selectedLevel = "normal";





const buttons =

    document.querySelectorAll(".behavior-btn");






buttons.forEach(function (button) {


    button.addEventListener("click", function () {



        selectedLevel =

            button.dataset.value;





        buttons.forEach(function (btn) {


            btn.classList.remove("selected");


        });




        button.classList.add("selected");



    });


});









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






    document.getElementById("recordDate").value =

        record.date;





    document.getElementById("content").value =

        record.content;







    if (record.level === "warning") {

        selectedLevel = "normal";

    }
    else {

        selectedLevel = record.level || "normal";

    }






    buttons.forEach(function (button) {



        button.classList.remove("selected");



        if (button.dataset.value === selectedLevel) {


            button.classList.add("selected");


        }


    });





}







loadRecord();









const updateButton =

    document.getElementById("updateButton");






updateButton.addEventListener("click", async function () {





    const date =

        document.getElementById("recordDate").value;





    const content =

        document.getElementById("content").value.trim();







    if (!date) {


        alert("날짜를 선택하세요.");

        return;

    }







    if (!content) {


        alert("내용을 입력하세요.");

        return;

    }







    await updateDoc(

        doc(db, "difficultBehaviors", id),

        {


            date: date,


            level: selectedLevel,


            content: content


        }


    );







    alert("수정되었습니다.");



    location.href = "difficult.html";



});