import { app } from "./firebase.js";

import { 
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    doc,
    updateDoc
} 
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const db = getFirestore(app);


let selectedBehavior = "";



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
        document.getElementById("morning").value,


        lunch:
        document.getElementById("lunch").value,


        afternoon:
        document.getElementById("afternoon").value,


        running:
        document.getElementById("running").value,


        weight:
        document.getElementById("weight").value,


        behavior:selectedBehavior


    };




    if(!record.date){


        alert("날짜를 선택하세요.");

        return;

    }







    const q = query(

        collection(db,"records"),

        where("date","==",record.date)

    );



    const snapshot = await getDocs(q);





    if(snapshot.empty){


        await addDoc(

            collection(db,"records"),

            record

        );


    }

    else{


        const documentId =
        snapshot.docs[0].id;



        await updateDoc(

            doc(db,"records",documentId),

            record

        );


    }





    alert("기록이 저장되었습니다.");



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






    const q = query(

        collection(db,"records"),

        where("date","==",date)

    );





    const snapshot =
    await getDocs(q);





    if(snapshot.empty){


        alert("해당 날짜 기록이 없습니다.");

        return;

    }






    const record =
    snapshot.docs[0].data();







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