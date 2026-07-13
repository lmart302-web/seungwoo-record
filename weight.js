const records =

JSON.parse(localStorage.getItem("dailyRecords")) || [];



const monthTitle =

document.getElementById("monthTitle");



const ctx =

document.getElementById("weightChart");



const weightList =

document.getElementById("weightList");




let currentDate = new Date();

let chart;







function drawWeight(){



    const year =

    currentDate.getFullYear();



    const month =

    currentDate.getMonth();





    monthTitle.innerText =

    year + "년 " + (month + 1) + "월";





    const labels = [];

    const weights = [];







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






drawWeight();