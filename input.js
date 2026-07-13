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



saveButton.addEventListener("click", function(){



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





    let records =

    JSON.parse(localStorage.getItem("dailyRecords")) || [];







    const index =

    records.findIndex(function(item){


        return item.date === record.date;


    });






    if(index !== -1){


        records[index] = record;


    } else {


        records.push(record);


    }







    localStorage.setItem(

        "dailyRecords",

        JSON.stringify(records)

    );






    alert("기록이 저장되었습니다.");



});

const loadButton =
document.getElementById("loadButton");



loadButton.addEventListener("click", function(){



    const date =

    document.getElementById("recordDate").value;



    if(!date){


        alert("날짜를 선택하세요.");


        return;


    }






    const records =

    JSON.parse(localStorage.getItem("dailyRecords")) || [];






    const record =

    records.find(function(item){


        return item.date === date;


    });






    if(!record){


        alert("해당 날짜 기록이 없습니다.");


        return;


    }







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





});