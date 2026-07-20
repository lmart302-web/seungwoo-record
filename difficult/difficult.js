console.log("difficult.js 실행됨");


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






async function loadDifficultRecords() {


    const snapshot = await getDocs(

        collection(db, "difficultBehaviors")

    );



    let records = [];



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






    if (records.length === 0) {


        difficultList.innerHTML =

            `
        <tr>
        <td colspan="4">
        기록 없음
        </td>
        </tr>
        `;


        return;

    }







    records.forEach(function (record) {



        const tr =

            document.createElement("tr");





        let levelText = "";



        if (record.level === "warning") {


            levelText = "🟡 보통";


        }
        else {


            levelText = "🔴 어려움";


        }






        tr.innerHTML =


            `
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







        // 내용 클릭 → 상세보기

        tr.querySelector(".difficult-content")
            .addEventListener("click", function () {


                location.href =
                    "difficultView.html?id=" + record.id;


            });






        // 수정

        tr.querySelector(".edit-btn")
            .addEventListener("click", function () {


                location.href =
                    "difficultEdit.html?id=" + record.id;


            });







        // 삭제

        tr.querySelector(".delete-btn")
            .addEventListener("click", async function () {



                const result =
                    confirm("삭제하시겠습니까?");



                if (result) {


                    await deleteDoc(

                        doc(
                            db,
                            "difficultBehaviors",
                            record.id
                        )

                    );


                    alert("삭제되었습니다.");


                    loadDifficultRecords();


                }



            });





        difficultList.appendChild(tr);



    });



}





loadDifficultRecords();