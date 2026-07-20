console.log("difficultInput.js 실행됨");


import { app } from "./firebase.js";


import {
    getFirestore,
    collection,
    addDoc
}
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";



const db = getFirestore(app);





const saveButton =

document.getElementById("saveButton");






saveButton.addEventListener("click", async function(){



    const date =

    document.getElementById("recordDate").value;



    const content =

    document.getElementById("content").value.trim();





    if(!date){


        alert("날짜를 선택하세요.");

        return;

    }




    if(!content){


        alert("내용을 입력하세요.");

        return;

    }







    await addDoc(

        collection(db,"difficultBehaviors"),

        {


            date:date,


            content:content,


            createdAt:new Date()


        }


    );







    alert("저장되었습니다.");



    location.href="difficult.html";



});