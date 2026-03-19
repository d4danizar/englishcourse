module.exports = [
"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/classes/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"405f07e59e237b280561040288a2fcf43cc990e8e7":"createSession","406fab5010ee2af34dc01cba1a93bcf83906382055":"updateSession","40f16d55d1e87f002c57c3d2309fdbc992dd33b8c5":"deleteSession"},"",""] */ __turbopack_context__.s([
    "createSession",
    ()=>createSession,
    "deleteSession",
    ()=>deleteSession,
    "updateSession",
    ()=>updateSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function createSession(formData) {
    try {
        const title = formData.get("title");
        const date = formData.get("date");
        const timeSlot = formData.get("timeSlot");
        const programType = formData.get("programType");
        const tutorId = formData.get("tutorId");
        if (!title || !date || !timeSlot || !programType || !tutorId) {
            return {
                error: "All fields are required: Title, Date, Time Slot, Program Type, and Tutor."
            };
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].session.create({
            data: {
                title,
                date: new Date(date),
                timeSlot,
                programType,
                tutorId
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/classes");
        return {
            success: true
        };
    } catch (error) {
        return {
            error: error.message || "Failed to create session."
        };
    }
}
async function deleteSession(sessionId) {
    try {
        // Attendance records will cascade delete due to onDelete: Cascade in schema
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].session.delete({
            where: {
                id: sessionId
            }
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/classes");
        return {
            success: true
        };
    } catch (error) {
        return {
            error: error.message || "Failed to delete session."
        };
    }
}
async function updateSession(formData) {
    try {
        const sessionId = formData.get("sessionId");
        const title = formData.get("title");
        const date = formData.get("date");
        const timeSlot = formData.get("timeSlot");
        const programType = formData.get("programType");
        const tutorId = formData.get("tutorId");
        if (!sessionId) return {
            error: "Session ID is required."
        };
        const data = {};
        if (title) data.title = title;
        if (date) data.date = new Date(date);
        if (timeSlot) data.timeSlot = timeSlot;
        if (programType) data.programType = programType;
        if (tutorId) data.tutorId = tutorId;
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].session.update({
            where: {
                id: sessionId
            },
            data
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/classes");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/tutor/dashboard");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/tutor/schedules");
        return {
            success: true
        };
    } catch (error) {
        return {
            error: error.message || "Failed to update session."
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    createSession,
    deleteSession,
    updateSession
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(createSession, "405f07e59e237b280561040288a2fcf43cc990e8e7", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(deleteSession, "40f16d55d1e87f002c57c3d2309fdbc992dd33b8c5", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateSession, "406fab5010ee2af34dc01cba1a93bcf83906382055", null);
}),
"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/classes/roster-actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"4046e135afdb4b2e167355db53084c3e78498b6751":"bulkCreateSessions"},"",""] */ __turbopack_context__.s([
    "bulkCreateSessions",
    ()=>bulkCreateSessions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function bulkCreateSessions(payload) {
    try {
        if (!payload || payload.length === 0) {
            return {
                error: "No sessions to create. Please assign at least one tutor."
            };
        }
        // Validate all entries have required fields
        for (const entry of payload){
            if (!entry.title || !entry.date || !entry.timeSlot || !entry.programType || !entry.tutorId) {
                return {
                    error: `Missing required fields in session: ${entry.timeSlot} on ${entry.date}`
                };
            }
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].session.createMany({
            data: payload.map((s)=>({
                    title: s.title,
                    date: new Date(s.date),
                    timeSlot: s.timeSlot,
                    programType: s.programType,
                    tutorId: s.tutorId
                }))
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/classes");
        return {
            success: true,
            count: payload.length
        };
    } catch (error) {
        console.error("bulkCreateSessions error:", error);
        return {
            error: error.message || "Failed to create sessions."
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    bulkCreateSessions
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(bulkCreateSessions, "4046e135afdb4b2e167355db53084c3e78498b6751", null);
}),
"[project]/Desktop/Belajar Programming/KampungInggris/src/lib/student-pool.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getEligibleStudentsForSession",
    ()=>getEligibleStudentsForSession,
    "getGlobalPoolForSession",
    ()=>getGlobalPoolForSession
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$date$2d$fns$2f$startOfDay$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/date-fns/startOfDay.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$date$2d$fns$2f$endOfDay$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/date-fns/endOfDay.js [app-rsc] (ecmascript)");
;
;
// Map session programType → eligible student activeProgram values (strict radar)
function getEligiblePrograms(programType) {
    const normType = programType.trim().toLowerCase();
    switch(normType){
        case "conversation":
            return [
                "Regular",
                "Fullday",
                "Asrama"
            ];
        case "efk":
            return [
                "EFK"
            ];
        case "eft":
            return [
                "EFT"
            ];
        case "private":
            return [
                "Private"
            ];
        case "toefl prep":
        case "toefl":
            return [
                "TOEFL",
                "TOEFL Prep"
            ];
        case "english on saturday":
            return [
                "English on Saturday"
            ];
        default:
            return [
                programType
            ];
    }
}
// Get broader pool for manual "Add Student" dropdown
function getGlobalPoolPrograms(programType) {
    const normType = programType.trim().toLowerCase();
    switch(normType){
        case "conversation":
            return [
                "Regular",
                "Fullday",
                "Asrama",
                "English on Saturday"
            ];
        case "efk":
            return [
                "EFK"
            ];
        case "eft":
            return [
                "EFT"
            ];
        case "english on saturday":
            return [
                "English on Saturday"
            ];
        case "private":
            return [
                "Private"
            ];
        case "toefl prep":
        case "toefl":
            return [
                "TOEFL",
                "TOEFL Prep"
            ];
        default:
            return [
                programType
            ];
    }
}
async function getEligibleStudentsForSession(session) {
    const eligiblePrograms = getEligiblePrograms(session.programType);
    const sessionStartOfDay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$date$2d$fns$2f$startOfDay$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["startOfDay"])(session.date);
    const sessionEndOfDay = (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$date$2d$fns$2f$endOfDay$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["endOfDay"])(session.date);
    // Broad fetch: all active students with matching programs + valid date range
    const candidateStudents = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findMany({
        where: {
            role: "STUDENT",
            activeProgram: {
                in: eligiblePrograms
            },
            OR: [
                {
                    startDate: null
                },
                {
                    startDate: {
                        lte: sessionEndOfDay
                    }
                }
            ],
            AND: [
                {
                    OR: [
                        {
                            endDate: null
                        },
                        {
                            endDate: {
                                gte: sessionStartOfDay
                            }
                        }
                    ]
                }
            ]
        },
        select: {
            id: true,
            name: true,
            activeProgram: true,
            programBatch: true,
            batchSchedule: true,
            endDate: true,
            startDate: true
        },
        orderBy: {
            name: "asc"
        }
    });
    // Precise filtering based on business rules
    const sessionDay = session.date.getDay(); // 0=Sun, 1=Mon .. 6=Sat
    return candidateStudents.filter((student)=>{
        if (!student.activeProgram) return false;
        const prog = student.activeProgram.trim().toLowerCase();
        // --- MULAI DEBUGGER ---
        if (student.activeProgram === "Regular") {
            console.log("=== CEK MURID REGULAR ===");
            console.log("Nama:", student.name);
            console.log("Student Batch Asli:", `"${student.programBatch}"`);
            console.log("Session Time Asli:", `"${session.timeSlot}"`);
            console.log("Session ProgramType:", `"${session.programType}"`);
            // Cek apakah masa aktifnya nyangkut
            console.log("Session Date:", session.date);
            console.log("Student End Date:", student.endDate);
            console.log("=========================");
        }
        // --- AKHIR DEBUGGER ---
        const sessionProgType = session.programType.trim().toLowerCase();
        // --- CONVERSATION RULES ---
        if (sessionProgType === "conversation") {
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
            return false;
        }
        // --- EFK / EFT RULES (day-matching) ---
        if (sessionProgType === "efk" || sessionProgType === "eft") {
            if (prog !== sessionProgType) return false;
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
        // --- ENGLISH ON SATURDAY ---
        if (sessionProgType === "english on saturday") {
            return prog === "english on saturday";
        }
        // --- PRIVATE / TOEFL / HYBRID POOL ---
        const isAssignedPool = sessionProgType === "private" || sessionProgType === "toefl" || sessionProgType === "toefl prep";
        if (isAssignedPool) {
            if (!session.assignedStudents) return false;
            const isAssigned = session.assignedStudents.some((as)=>as.id === student.id);
            return isAssigned && prog === sessionProgType;
        }
        // --- OTHER ---
        return prog === sessionProgType;
    }).map((s)=>({
            id: s.id,
            name: s.name,
            activeProgram: s.activeProgram
        }));
}
async function getGlobalPoolForSession(session) {
    const poolPrograms = getGlobalPoolPrograms(session.programType);
    const students = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].user.findMany({
        where: {
            role: "STUDENT",
            activeProgram: {
                in: poolPrograms
            }
        },
        select: {
            id: true,
            name: true,
            activeProgram: true
        },
        orderBy: {
            name: "asc"
        }
    });
    return students.map((s)=>({
            id: s.id,
            name: s.name,
            activeProgram: s.activeProgram
        }));
}
}),
"[project]/Desktop/Belajar Programming/KampungInggris/src/lib/session-detail-actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"402b42066f2aae43ea7bffeaf7b95bbf553cfccf92":"updateAttendance","4075cce5983a77c069a70ae4da101b123477eafb84":"getSessionDetail"},"",""] */ __turbopack_context__.s([
    "getSessionDetail",
    ()=>getSessionDetail,
    "updateAttendance",
    ()=>updateAttendance
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$student$2d$pool$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/lib/student-pool.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
;
async function getSessionDetail(sessionId) {
    const session = await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].session.findUnique({
        where: {
            id: sessionId
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
            },
            attendances: {
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            activeProgram: true
                        }
                    }
                },
                orderBy: {
                    student: {
                        name: "asc"
                    }
                }
            }
        }
    });
    if (!session) return null;
    const sessionDay = session.date.getDay();
    const isEvalDay = sessionDay === 5 || sessionDay === 6 && session.programType === "English on Saturday"; // Saturday for specific program
    // Get eligible students (strict radar)
    const eligibleStudents = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$student$2d$pool$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getEligibleStudentsForSession"])({
        date: session.date,
        timeSlot: session.timeSlot,
        programType: session.programType,
        assignedStudents: session.assignedStudents
    });
    // Get global pool for manual add (broad)
    const globalPoolStudents = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$student$2d$pool$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getGlobalPoolForSession"])({
        programType: session.programType
    });
    // Build attendance IDs set for exclusion from global pool
    const attendedIds = new Set(session.attendances.map((a)=>a.studentId));
    const eligibleIds = new Set(eligibleStudents.map((s)=>s.id));
    return {
        id: session.id,
        title: session.title,
        date: session.date.toISOString(),
        timeSlot: session.timeSlot,
        programType: session.programType,
        isCompleted: session.isCompleted,
        tutorName: session.tutor.name,
        isEvalDay,
        attendances: session.attendances.map((a)=>({
                id: a.id,
                studentId: a.student.id,
                studentName: a.student.name,
                studentProgram: a.student.activeProgram,
                status: a.status,
                pronunciation: a.pronunciation,
                fluency: a.fluency,
                vocabulary: a.vocabulary,
                tutorNotes: a.tutorNotes,
                rescheduleNotes: a.rescheduleNotes
            })),
        eligibleStudents,
        globalPoolStudents: globalPoolStudents.filter((s)=>!attendedIds.has(s.id) && !eligibleIds.has(s.id))
    };
}
async function updateAttendance(formData) {
    try {
        const sessionId = formData.get("sessionId");
        const studentIds = formData.getAll("studentId");
        const statuses = formData.getAll("status");
        const pronunciations = formData.getAll("pronunciation");
        const fluencies = formData.getAll("fluency");
        const vocabularies = formData.getAll("vocabulary");
        const tutorNotes = formData.get("tutorNotes");
        if (!sessionId || studentIds.length === 0) {
            return {
                error: "Session ID and at least one student are required."
            };
        }
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            for(let i = 0; i < studentIds.length; i++){
                const studentId = studentIds[i];
                const status = statuses[i] || "PRESENT";
                const pronunciation = parseInt(pronunciations[i]) || null;
                const fluency = parseInt(fluencies[i]) || null;
                const vocabulary = parseInt(vocabularies[i]) || null;
                // Upsert: update if exists, create if not
                await tx.attendance.upsert({
                    where: {
                        sessionId_studentId: {
                            sessionId,
                            studentId
                        }
                    },
                    update: {
                        status,
                        pronunciation,
                        fluency,
                        vocabulary,
                        tutorNotes: tutorNotes || null
                    },
                    create: {
                        sessionId,
                        studentId,
                        status,
                        pronunciation,
                        fluency,
                        vocabulary,
                        tutorNotes: tutorNotes || null
                    }
                });
            }
            // Mark session as completed
            await tx.session.update({
                where: {
                    id: sessionId
                },
                data: {
                    isCompleted: true
                }
            });
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/admin/classes");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/tutor");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/tutor/dashboard");
        return {
            success: true
        };
    } catch (error) {
        console.error("updateAttendance error:", error);
        return {
            error: error.message || "Failed to update attendance."
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    getSessionDetail,
    updateAttendance
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(getSessionDetail, "4075cce5983a77c069a70ae4da101b123477eafb84", null);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(updateAttendance, "402b42066f2aae43ea7bffeaf7b95bbf553cfccf92", null);
}),
"[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(admin)/admin/classes/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/classes/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/classes/roster-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/lib/session-detail-actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$classes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/classes/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$classes$2f$roster$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/classes/roster-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$session$2d$detail$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/lib/session-detail-actions.ts [app-rsc] (ecmascript)");
;
;
;
;
;
;
}),
"[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(admin)/admin/classes/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/classes/actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE1 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/classes/roster-actions.ts [app-rsc] (ecmascript)\", ACTIONS_MODULE2 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/lib/session-detail-actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "402b42066f2aae43ea7bffeaf7b95bbf553cfccf92",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$session$2d$detail$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateAttendance"],
    "4046e135afdb4b2e167355db53084c3e78498b6751",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$classes$2f$roster$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["bulkCreateSessions"],
    "405f07e59e237b280561040288a2fcf43cc990e8e7",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$classes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["createSession"],
    "406fab5010ee2af34dc01cba1a93bcf83906382055",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$classes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["updateSession"],
    "4075cce5983a77c069a70ae4da101b123477eafb84",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$session$2d$detail$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["getSessionDetail"],
    "40f16d55d1e87f002c57c3d2309fdbc992dd33b8c5",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$classes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["deleteSession"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f2e$next$2d$internal$2f$server$2f$app$2f28$admin$292f$admin$2f$classes$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$classes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE1__$3d3e$__$225b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$classes$2f$roster$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29222c$__ACTIONS_MODULE2__$3d3e$__$225b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$session$2d$detail$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(admin)/admin/classes/page/actions.js { ACTIONS_MODULE0 => "[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/classes/actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE1 => "[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/classes/roster-actions.ts [app-rsc] (ecmascript)", ACTIONS_MODULE2 => "[project]/Desktop/Belajar Programming/KampungInggris/src/lib/session-detail-actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$classes$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/classes/actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$admin$292f$admin$2f$classes$2f$roster$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/app/(admin)/admin/classes/roster-actions.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$session$2d$detail$2d$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/lib/session-detail-actions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=Desktop_Belajar%20Programming_KampungInggris_36d86964._.js.map