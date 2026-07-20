console.log("difficult.js 실행됨");

const auth =
sessionStorage.getItem("difficultAuth");


if(auth !== "true"){

    const password =
    prompt("비밀번호를 입력하세요");


    if(password === "1002"){

        sessionStorage.setItem(
            "difficultAuth",
            "true"
        );

    }else{

        location.href="../behavior.html";

    }

}

import { app } from "../firebase.js";


import {
    getFirestore,
    collection,
    getDocs,
    deleteDoc,
    doc
}
    from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";



const db = getFirestore(app);



const difficultList =
    document.getElementById("difficultList");


const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");

const pageSize = 10;

let currentPage = 1;
let records = [];



async function loadDifficultRecords() {
    
    records = [];


    const snapshot = await getDocs(

        collection(db, "difficultBehaviors")

    );


    snapshot.forEach(function (doc) {


        records.push({

            id: doc.id,

            ...doc.data()

        });


    });






    records.sort(function (a, b) {


        return new Date(b.date) - new Date(a.date);


    });






    difficultList.innerHTML = "";

    if(records.length===0){

    difficultList.innerHTML=`
    <tr>
        <td colspan="4">
        기록 없음
        </td>
    </tr>
    `;

    pageInfo.textContent="1 / 1";

    return;
}

renderPage();

}
    
function renderPage() {

    difficultList.innerHTML = "";

    const totalPage =
    Math.ceil(records.length/pageSize);

    const start =
    (currentPage-1)*pageSize;

    const end =
    start+pageSize;

    const pageRecords =
records.slice(start,end);

pageInfo.textContent =
currentPage + " / " + totalPage;



    pageRecords.forEach(function(record){

    const tr =
    document.createElement("tr");

    let levelText = "";

    if(record.level==="warning"){

    levelText="🟡 보통";

}else{

    levelText="🔴 어려움";

}


tr.innerHTML = `

<td>
${record.date}
</td>

<td>
${levelText}
</td>

<td class="difficult-content">
${record.content}
</td>

<td>

<button class="edit-btn">
수정
</button>

<button class="delete-btn">
삭제
</button>

</td>

`;

tr.querySelector(".difficult-content")
.addEventListener("click", function(){

    location.href =
    "difficultView.html?id=" + record.id;

});


tr.querySelector(".edit-btn")
.addEventListener("click", function(){

    location.href =
    "difficultEdit.html?id=" + record.id;

});


tr.querySelector(".delete-btn")
.addEventListener("click", async function(){

    const result =
    confirm("삭제하시겠습니까?");


    if(result){

        await deleteDoc(

            doc(
                db,
                "difficultBehaviors",
                record.id
            )

        );


        alert("삭제되었습니다.");


        records =
        records.filter(function(item){

            return item.id !== record.id;

        });


        const totalPage =
        Math.max(
            1,
            Math.ceil(records.length / pageSize)
        );


        if(currentPage > totalPage){

            currentPage = totalPage;

        }


        renderPage();

    }

});


difficultList.appendChild(tr);

});

}

prevBtn.addEventListener("click", function () {

    if (currentPage > 1) {

        currentPage--;

        renderPage();
        window.scrollTo(0,0);

    }

});

nextBtn.addEventListener("click", function () {

    const totalPage =
        Math.ceil(records.length / pageSize);

    if (currentPage < totalPage) {

        currentPage++;

        renderPage();
        window.scrollTo(0,0);

    }

});

loadDifficultRecords();