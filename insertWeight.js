import { app } from "./firebase.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc,
    writeBatch
}
from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const db = getFirestore(app);


/* =========================
   입력할 체중 데이터
========================= */

const weightData = [

    { date: "2025-10-31", weight: 100.90 },

    { date: "2025-11-05", weight: 100.90 },
    { date: "2025-11-12", weight: 98.60 },
    { date: "2025-11-19", weight: 98.90 },
    { date: "2025-11-24", weight: 99.80 },

    { date: "2025-12-01", weight: 99.90 },
    { date: "2025-12-04", weight: 98.60 },
    { date: "2025-12-08", weight: 98.30 },
    { date: "2025-12-12", weight: 98.50 },
    { date: "2025-12-19", weight: 98.20 },
    { date: "2025-12-22", weight: 99.20 },
    { date: "2025-12-26", weight: 98.40 },

    { date: "2026-01-02", weight: 97.70 },
    { date: "2026-01-12", weight: 98.40 },
    { date: "2026-01-15", weight: 99.40 },
    { date: "2026-01-21", weight: 96.67 },
    { date: "2026-01-22", weight: 95.52 },
    { date: "2026-01-26", weight: 97.22 },
    { date: "2026-01-28", weight: 95.02 },
    { date: "2026-01-29", weight: 96.97 },
    { date: "2026-01-30", weight: 94.85 },

    { date: "2026-02-02", weight: 95.27 },
    { date: "2026-02-04", weight: 95.65 },
    { date: "2026-02-05", weight: 96.97 },
    { date: "2026-02-06", weight: 95.60 },
    { date: "2026-02-09", weight: 99.56 },
    { date: "2026-02-11", weight: 96.92 },
    { date: "2026-02-12", weight: 97.02 },
    { date: "2026-02-13", weight: 99.62 },
    { date: "2026-02-19", weight: 99.80 },
    { date: "2026-02-20", weight: 100.80 },
    { date: "2026-02-23", weight: 98.13 },
    { date: "2026-02-24", weight: 98.63 },
    { date: "2026-02-25", weight: 100.02 },
    { date: "2026-02-26", weight: 98.80 },
    { date: "2026-02-27", weight: 100.72 }

];



/* =========================
   데이터 입력
========================= */

async function insertWeights() {

    try {

        console.log("체중 데이터 입력 시작");


        /* 기존 records 확인 */

        const snapshot =
            await getDocs(
                collection(db, "records")
            );


        const existing =
            new Set();


        snapshot.forEach(function (item) {

            const data =
                item.data();


            if (
                data.date &&
                data.weight !== undefined
            ) {

                existing.add(
                    `${data.date}|${Number(data.weight).toFixed(2)}`
                );

            }

        });



        /* Batch 생성 */

        const batch =
            writeBatch(db);


        let added = 0;

        let skipped = 0;



        weightData.forEach(function (item, index) {

            const key =
                `${item.date}|${Number(item.weight).toFixed(2)}`;


            /* 이미 같은 기록이 있으면 건너뜀 */

            if (existing.has(key)) {

                skipped++;

                return;

            }



            /* 새로운 문서 ID */

            const docId =
                `importWeight_${item.date.replaceAll("-", "")}_${index + 1}`;


            const weightDoc =
                doc(
                    db,
                    "records",
                    docId
                );


            batch.set(
                weightDoc,
                {

                    date: item.date,

                    weight: item.weight

                }
            );


            added++;

        });



        /* 실제 저장 */

        if (added > 0) {

            await batch.commit();

        }



        console.log(
            `입력 완료: ${added}개 추가 / ${skipped}개 건너뜀`
        );


        alert(
            `체중 데이터 입력 완료!\n\n` +
            `${added}개 추가\n` +
            `${skipped}개는 이미 있어서 건너뜀`
        );


    }
    catch (error) {

        console.error(
            "체중 데이터 입력 실패:",
            error
        );


        alert(
            "입력 실패\n\n" +
            error.message
        );

    }

}


insertWeights();