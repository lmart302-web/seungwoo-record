console.log("weight.js 실행됨");


import { app } from "./firebase.js";

import { 
    getFirestore, 
    collection, 
    getDocs 
} 
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const db = getFirestore(app);


let records = [];


const monthTitle =
document.getElementById("monthTitle");


const ctx =
document.getElementById("weightChart");


const weightList =
document.getElementById("weightList");


const weightChange =
document.getElementById("weightChange");


let currentDate = new Date();


let chart;





async function loadRecords(){


    const snapshot = await getDocs(

        collection(db,"records")

    );



    records = [];



    snapshot.forEach(function(doc){


        records.push(doc.data());


    });




    records.sort(function(a,b){


        return new Date(a.date) - new Date(b.date);


    });




    drawWeight();


}









function drawWeight(){



    // 날짜순 재정렬

    records.sort(function(a,b){


        return new Date(a.date) - new Date(b.date);


    });





    const year =
    currentDate.getFullYear();



    const month =
    currentDate.getMonth();





    monthTitle.innerText =

    year + "년 " + (month + 1) + "월";






    const labels = [];


    const weights = [];



    let firstWeight = null;


    let lastWeight = null;





    weightList.innerHTML = "";






    records.forEach(function(record){





        const recordDate =

        new Date(record.date);







        if(


            recordDate.getFullYear() === year &&


            recordDate.getMonth() === month &&


            record.weight



        ){






            labels.push(

                record.date.substring(8,10) + "일"

            );





            weights.push(

                Number(record.weight)

            );






            if(firstWeight === null){


                firstWeight = Number(record.weight);


            }



            lastWeight = Number(record.weight);







            const li =

            document.createElement("li");





            li.innerText =


            record.date +

            " : " +

            record.weight +

            "kg";





            weightList.appendChild(li);



        }



    });







    // 체중 변화 표시

    if(weightChange){


        if(firstWeight !== null && lastWeight !== null){



            const change =

            (lastWeight - firstWeight).toFixed(1);




            if(change > 0){


                weightChange.innerText =

                "체중 변화: +" + change + "kg";


            }

            else{


                weightChange.innerText =

                "체중 변화: " + change + "kg";


            }



        }

        else{


            weightChange.innerText = "";

        }


    }







    if(chart){


        chart.destroy();


    }







    chart = new Chart(ctx, {



        type:"line",



        data:{



            labels:labels,



            datasets:[



                {


                    label:"체중(kg)",


                    data:weights



                }



            ]



        },



        options:{



            responsive:true,



            scales:{



                y:{



                    beginAtZero:false



                }



            }



        }



    });



}









document

.getElementById("prevMonth")

.addEventListener("click",function(){



    currentDate.setMonth(

        currentDate.getMonth()-1

    );



    drawWeight();



});









document

.getElementById("nextMonth")

.addEventListener("click",function(){



    currentDate.setMonth(

        currentDate.getMonth()+1

    );



    drawWeight();



});









loadRecords();