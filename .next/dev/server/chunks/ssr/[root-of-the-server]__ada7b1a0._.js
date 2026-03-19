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
"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(student)/student/schedules/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40fa7f4ebe14f552833df0bc6e6c4c245d2af04184":"getStudentUpcomingSchedules"},"",""] */ __turbopack_context__.s([
    "getStudentUpcomingSchedules",
    ()=>getStudentUpcomingSchedules
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
async function getStudentUpcomingSchedules(studentId) {
    const student = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findUnique({
        where: {
            id: studentId
        },
        select: {
            activeProgram: true,
            programBatch: true,
            batchSchedule: true,
            startDate: true,
            endDate: true
        }
    });
    console.log("=== DEBUG REVERSE RADAR ===");
    console.log("0. Raw Student Object:", student);
    console.log("===========================");
    if (!student || !student.activeProgram) {
        return [];
    }
    // Set today start to 00:00
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Safely determine upper bound for dates
    let safeEndDate;
    if (student.endDate) {
        safeEndDate = new Date(student.endDate);
        safeEndDate.setHours(23, 59, 59, 999);
    } else {
        // If no endDate provided, let the student see classes for the next 14 days
        safeEndDate = new Date();
        safeEndDate.setDate(safeEndDate.getDate() + 14);
        safeEndDate.setHours(23, 59, 59, 999);
    }
    // Broad fetch: all incomplete sessions from today until the student's end date
    const candidateSessions = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].session.findMany({
        where: {
            date: {
                gte: today,
                lte: safeEndDate
            },
            isCompleted: false
        },
        include: {
            tutor: {
                select: {
                    name: true
                }
            },
            assignedStudents: {
                select: {
                    id: true
                }
            }
        },
        orderBy: [
            {
                date: "asc"
            },
            {
                timeSlot: "asc"
            }
        ]
    });
    console.log("=== DEBUG REVERSE RADAR ===");
    console.log("1. Student Program:", student.activeProgram, "| Batch:", student.programBatch);
    console.log("2. Total Sessions Fetched from DB:", candidateSessions.length);
    if (candidateSessions.length > 0) {
        console.log("3. Sample Session 0 ProgramType:", candidateSessions[0].programType, "| TimeSlot:", candidateSessions[0].timeSlot, "| Date:", candidateSessions[0].date);
    }
    console.log("===========================");
    // Apply Reverse Radar Logic
    const validSessions = candidateSessions.filter((session)=>{
        const sType = session.programType.trim().toLowerCase();
        const prog = student.activeProgram.trim().toLowerCase();
        const sessionDay = session.date.getDay();
        // -- CONVERSATION (Regular, Fullday, Asrama)
        if (sType === "conversation") {
            if (prog === "regular") {
                if (!student.programBatch) return false;
                const normBatch = student.programBatch.trim().toLowerCase();
                const normTime = session.timeSlot.trim().toLowerCase();
                return normTime.includes(normBatch) || normBatch.includes(normTime);
            }
            if (prog === "fullday") {
                return session.timeSlot.trim().toLowerCase() !== "18:30 - 20:00";
            }
            if (prog === "asrama") {
                return true;
            }
            return false; // Not one of the above, can't see Conversation
        }
        // -- EFK / EFT
        if (sType === "efk" || sType === "eft") {
            if (prog !== sType) return false;
            const batchSchedule = (student.batchSchedule || "").trim().toLowerCase();
            if (sessionDay === 1 || sessionDay === 3) {
                return batchSchedule === "senin-rabu";
            }
            if (sessionDay === 2 || sessionDay === 4) {
                return batchSchedule === "selasa-kamis";
            }
            if (sessionDay === 5 || sessionDay === 6) {
                return batchSchedule === "jumat-sabtu";
            }
            return false;
        }
        // -- ENGLISH ON SATURDAY
        if (sType === "english on saturday") {
            return prog === "english on saturday";
        }
        // -- PRIVATE / TOEFL / HYBRID POOL ---
        const isAssignedPool = sType === "private" || sType === "toefl" || sType === "toefl prep";
        if (isAssignedPool) {
            if (!session.assignedStudents) return false;
            const isAssigned = session.assignedStudents.some((as)=>as.id === studentId);
            return isAssigned && prog === sType;
        }
        // -- OTHER STRICT PROGRAMS
        return prog === sType;
    });
    return validSessions;
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getStudentUpcomingSchedules
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getStudentUpcomingSchedules, "40fa7f4ebe14f552833df0bc6e6c4c245d2af04184", null);
}),
"[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(student)/student/schedules/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(student)/student/schedules/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$student$292f$student$2f$schedules$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/app/(student)/student/schedules/actions.ts [app-rsc] (ecmascript)");
;
}),
"[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(student)/student/schedules/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(student)/student/schedules/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "40fa7f4ebe14f552833df0bc6e6c4c245d2af04184",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$student$292f$student$2f$schedules$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getStudentUpcomingSchedules"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f2e$next$2d$internal$2f$server$2f$app$2f28$student$292f$student$2f$schedules$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$student$292f$student$2f$schedules$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(student)/student/schedules/page/actions.js { ACTIONS_MODULE0 => "[project]/Desktop/Belajar Programming/KampungInggris/src/app/(student)/student/schedules/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$student$292f$student$2f$schedules$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/app/(student)/student/schedules/actions.ts [app-rsc] (ecmascript)");
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

//# sourceMappingURL=%5Broot-of-the-server%5D__ada7b1a0._.js.map