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
"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(tutor)/tutor/actions.ts [app-rsc] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/* __next_internal_action_entry_do_not_use__ [{"40d5e7cb276ebacf0e47fe391ff259474a65e8c531":"submitAttendance"},"",""] */ __turbopack_context__.s([
    "submitAttendance",
    ()=>submitAttendance
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/server-reference.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/lib/prisma.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/cache.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-validate.js [app-rsc] (ecmascript)");
;
;
;
async function submitAttendance(formData) {
    try {
        const sessionId = formData.get("sessionId");
        const studentIds = formData.getAll("studentId");
        const statuses = formData.getAll("status");
        const pronunciations = formData.getAll("pronunciation");
        const fluencies = formData.getAll("fluency");
        const vocabularies = formData.getAll("vocabulary");
        const tutorNotes = formData.get("tutorNotes");
        const rescheduleNotes = formData.get("rescheduleNotes");
        if (!sessionId || studentIds.length === 0) {
            return {
                error: "Session ID and at least one student are required."
            };
        }
        // Use a transaction to atomically create attendance records AND mark session complete
        await __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$lib$2f$prisma$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["prisma"].$transaction(async (tx)=>{
            // 1. Upsert attendance for each student
            for(let i = 0; i < studentIds.length; i++){
                const studentId = studentIds[i];
                const status = statuses[i] || "PRESENT";
                const pronunciation = parseInt(pronunciations[i]) || null;
                const fluency = parseInt(fluencies[i]) || null;
                const vocabulary = parseInt(vocabularies[i]) || null;
                // Check if attendance already exists for this session+student
                const existing = await tx.attendance.findFirst({
                    where: {
                        sessionId,
                        studentId
                    }
                });
                if (existing) {
                    await tx.attendance.update({
                        where: {
                            id: existing.id
                        },
                        data: {
                            status,
                            pronunciation,
                            fluency,
                            vocabulary,
                            tutorNotes: tutorNotes || null,
                            rescheduleNotes: rescheduleNotes || null
                        }
                    });
                } else {
                    await tx.attendance.create({
                        data: {
                            sessionId,
                            studentId,
                            status,
                            pronunciation,
                            fluency,
                            vocabulary,
                            tutorNotes: tutorNotes || null,
                            rescheduleNotes: rescheduleNotes || null
                        }
                    });
                }
            }
            // 2. Mark the session as completed (triggers payroll calculation)
            await tx.session.update({
                where: {
                    id: sessionId
                },
                data: {
                    isCompleted: true
                }
            });
        });
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/tutor");
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$cache$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["revalidatePath"])("/tutor/dashboard");
        return {
            success: true
        };
    } catch (error) {
        console.error("submitAttendance error:", error);
        return {
            error: error.message || "Failed to submit attendance."
        };
    }
}
;
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$validate$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["ensureServerEntryExports"])([
    submitAttendance
]);
(0, __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$server$2d$reference$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerServerReference"])(submitAttendance, "40d5e7cb276ebacf0e47fe391ff259474a65e8c531", null);
}),
"[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(tutor)/tutor/dashboard/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(tutor)/tutor/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$tutor$292f$tutor$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/app/(tutor)/tutor/actions.ts [app-rsc] (ecmascript)");
;
}),
"[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(tutor)/tutor/dashboard/page/actions.js { ACTIONS_MODULE0 => \"[project]/Desktop/Belajar Programming/KampungInggris/src/app/(tutor)/tutor/actions.ts [app-rsc] (ecmascript)\" } [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "40d5e7cb276ebacf0e47fe391ff259474a65e8c531",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$tutor$292f$tutor$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["submitAttendance"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f2e$next$2d$internal$2f$server$2f$app$2f28$tutor$292f$tutor$2f$dashboard$2f$page$2f$actions$2e$js__$7b$__ACTIONS_MODULE0__$3d3e$__$225b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$tutor$292f$tutor$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$2922$__$7d$__$5b$app$2d$rsc$5d$__$28$server__actions__loader$2c$__ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i('[project]/Desktop/Belajar Programming/KampungInggris/.next-internal/server/app/(tutor)/tutor/dashboard/page/actions.js { ACTIONS_MODULE0 => "[project]/Desktop/Belajar Programming/KampungInggris/src/app/(tutor)/tutor/actions.ts [app-rsc] (ecmascript)" } [app-rsc] (server actions loader, ecmascript) <locals>');
var __TURBOPACK__imported__module__$5b$project$5d2f$Desktop$2f$Belajar__Programming$2f$KampungInggris$2f$src$2f$app$2f28$tutor$292f$tutor$2f$actions$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/Desktop/Belajar Programming/KampungInggris/src/app/(tutor)/tutor/actions.ts [app-rsc] (ecmascript)");
}),
];

//# sourceMappingURL=Desktop_Belajar%20Programming_KampungInggris_e107261e._.js.map