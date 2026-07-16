import { app } from "./firebase.js";

import { 
    getFirestore,
    doc,
    setDoc,
    getDoc
} 
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const db = getFirestore(app);


let selectedBehavior = "good";



const behaviorButtons =
document.querySelectorAll(".behavior-btn");



behaviorButtons.forEach(function(button){

    button.addEventListener("click",function(){


        selectedBehavior =
        button.dataset.value;


        behaviorButtons.forEach(function(btn){

            btn.classList.remove("selected");

        });


        button.classList.add("selected");


    });

});






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


        behavior:selectedBehavior,


        holiday:false


    };





    if(!record.date){


        alert("날짜를 선택하세요.");

        return;

    }




    // 아무 기록이 없으면 휴강 처리

    if(

        !record.morning &&
        !record.lunch &&
        !record.afternoon &&
        !record.running &&
        !record.weight

    ){
        
        record.behavior = "";
        record.holiday = true;

    }




    console.log("저장 문서:", record);



    await setDoc(

        doc(db,"records",record.date),

        record

    );





    if(record.holiday){

        alert("휴강으로 저장되었습니다.");

    }
    else{

        alert("기록이 저장되었습니다.");

    }



});









const loadButton =
document.getElementById("loadButton");




loadButton.addEventListener("click", async function(){



    const date =
    document.getElementById("recordDate").value;




    if(!date){


        alert("날짜를 선택하세요.");

        return;

    }





    const docRef =
    doc(db,"records",date);




    const snapshot =
    await getDoc(docRef);





    if(!snapshot.exists()){


        alert("해당 날짜 기록이 없습니다.");

        return;

    }





    const record =
    snapshot.data();







    document.getElementById("morning").value =

    record.morning || "";






    document.getElementById("lunch").value =

    record.lunch || "";






    document.getElementById("afternoon").value =

    record.afternoon || "";






    document.getElementById("running").value =

    record.running || "";






    document.getElementById("weight").value =

    record.weight || "";







    selectedBehavior =
    record.behavior || "";







    behaviorButtons.forEach(function(btn){


        btn.classList.remove("selected");



        if(btn.dataset.value === selectedBehavior){


            btn.classList.add("selected");


        }


    });




});