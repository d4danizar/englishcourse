module.exports = [
"[project]/Desktop/Belajar Programming/KampungInggris/src/lib/prisma.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prisma",
    ()=>prisma
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f40$prisma$2f$client$29$__ = __turbopack_context__.i("[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/Desktop/Belajar Programming/KampungInggris/node_modules/@prisma/client)");
;
const globalForPrisma = /*TURBOPACK member replacement*/ __turbopack_context__.g;
const prisma = globalForPrisma.prisma || new __TURBOPACK__imported__module__$5b$externals$5d2f40$prisma$2f$client__$5b$external$5d$__$2840$prisma$2f$client$2c$__cjs$2c$__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f40$prisma$2f$client$29$__["PrismaClient"]({
    log: [
        "query"
    ]
});
if ("TURBOPACK compile-time truthy", 1) globalForPrisma.prisma = prisma;
}),
"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(student)/student/certificate/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"4067ed42d830808717b8ce2eac74754a01a1cf4c48":"generateCertificateData"},"",""] */ __turbopack_context__.s([
    "generateCertificateData",
    ()=>generateCertificateData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
async function generateCertificateData(studentId) {
    // 1. Fetch Student Data
    const student = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: studentId
        },
        select: {
            id: true,
            name: true,
            activeProgram: true,
            startDate: true,
            endDate: true
        }
    });
    if (!student) {
        throw new Error("Student not found");
    }
    // Determine eligibility (has the program ended?)
    // We check if endDate is in the past compared to today.
    // If no endDate, we assume NOT eligible.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let isEligible = false;
    let finalScore = 0;
    if (student.endDate) {
        const end = new Date(student.endDate);
        end.setHours(0, 0, 0, 0);
        isEligible = today > end;
    }
    // 2. Calculate Final Score IF eligible (or just calculate anyway)
    // KITA HAPUS filter tanggal Prisma yang kaku agar tidak bentrok dengan Timezone
    const attendances = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].attendance.findMany({
        where: {
            studentId: student.id,
            status: "PRESENT"
        },
        include: {
            session: {
                select: {
                    date: true,
                    programType: true
                }
            }
        }
    });
    let sumFluency = 0;
    let sumPronunciation = 0;
    let sumVocabulary = 0;
    let validEvaluationCount = 0;
    attendances.forEach((att)=>{
        const sessionTime = new Date(att.session.date).getTime();
        const startTime = student.startDate ? new Date(student.startDate).getTime() : 0;
        const endTime = student.endDate ? new Date(student.endDate).setHours(23, 59, 59, 999) : Infinity;
        const isWithinActivePeriod = sessionTime >= startTime && sessionTime <= endTime;
        const hasScores = att.fluency && att.fluency > 0 || att.pronunciation && att.pronunciation > 0 || att.vocabulary && att.vocabulary > 0;
        if (hasScores && isWithinActivePeriod) {
            // Jumlahkan semua nilai per kategori
            sumFluency += att.fluency || 0;
            sumPronunciation += att.pronunciation || 0;
            sumVocabulary += att.vocabulary || 0;
            validEvaluationCount++;
        }
    });
    // Siapkan variabel nilai akhir
    let avgFluency = 0;
    let avgPronunciation = 0;
    let avgVocab = 0;
    let overallScore = 0;
    let predicate = "E";
    if (validEvaluationCount > 0) {
        // Hitung rata-rata per kategori
        avgFluency = sumFluency / validEvaluationCount;
        avgPronunciation = sumPronunciation / validEvaluationCount;
        avgVocab = sumVocabulary / validEvaluationCount;
        // Hitung rata-rata keseluruhan (Overall Score)
        overallScore = (avgFluency + avgPronunciation + avgVocab) / 3;
        // Tentukan Predikat (A-E)
        if (overallScore >= 9.0) predicate = "A";
        else if (overallScore >= 8.0) predicate = "B";
        else if (overallScore >= 7.0) predicate = "C";
        else if (overallScore >= 6.0) predicate = "D";
        else predicate = "E";
    }
    // Return data dengan format baru
    return {
        student: {
            name: student.name,
            activeProgram: student.activeProgram,
            startDate: student.startDate,
            endDate: student.endDate
        },
        scores: {
            fluency: Number(avgFluency.toFixed(1)),
            pronunciation: Number(avgPronunciation.toFixed(1)),
            vocabulary: Number(avgVocab.toFixed(1)),
            overall: Number(overallScore.toFixed(1)),
            predicate: predicate
        },
        isEligible
    };
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    generateCertificateData
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(generateCertificateData, "4067ed42d830808717b8ce2eac74754a01a1cf4c48", null);
}),
"[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(student)/student/certificate/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(student)/student/certificate/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$student$292f$student$2f$certificate$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/app/(student)/student/certificate/actions.ts [app-rsc] (ecmascript)");
;
}),
"[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(student)/student/certificate/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(student)/student/certificate/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "4067ed42d830808717b8ce2eac74754a01a1cf4c48",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$student$292f$student$2f$certificate$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["generateCertificateData"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f2e$next$2d$internal$2f$server$2f$app$2f28$student$292f$student$2f$certificate$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$student$292f$student$2f$certificate$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(student)/student/certificate/page/actions.js { ACTIONS_MODULE0 => "[project]/Desktop/Belajar Programming/KampungInggris/src/app/(student)/student/certificate/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$student$292f$student$2f$certificate$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/app/(student)/student/certificate/actions.ts [app-rsc] (ecmascript)");
}),
"[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

/* eslint-disable import/no-extraneous-dependencies */ Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "registerServerReference", {
    enumerable: true,
    get: function() {
        return _server.registerServerReference;
    }
});
const _server = __turbopack_context__.r("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)"); //# sourceMappingURL=server-reference.js.map
}),
"[externals]/@prisma/client [external] (@prisma/client, cjs, [project]/Desktop/Belajar Programming/KampungInggris/node_modules/@prisma/client)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("@prisma/client-ee837ca53fa16ba1", () => require("@prisma/client-ee837ca53fa16ba1"));

module.exports = mod;
}),
"[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

// This function ensures that all the exported values are valid server actions,
// during the runtime. By definition all actions are required to be async
// functions, but here we can only check that they are functions.
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ensureServerEntryExports", {
    enumerable: true,
    get: function() {
        return ensureServerEntryExports;
    }
});
function ensureServerEntryExports(actions) {
    for(let i = 0; i < actions.length; i++){
        const action = actions[i];
        if (typeof action !== 'function') {
            throw Object.defineProperty(new Error(`A "use server" file can only export async functions, found ${typeof action}.\nRead more: https://nextjs.org/docs/messages/invalid-use-server-value`), "__NEXT_ERROR_CODE", {
                value: "E352",
                enumerable: false,
                configurable: true
            });
        }
    }
} //# sourceMappingURL=action-validate.js.map
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__eca80df3._.js.map